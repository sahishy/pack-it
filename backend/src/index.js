import { z } from 'zod'
import { verifyFirebaseAppCheckToken, verifyFirebaseIdToken, verifyFirebaseTokenString } from './lib/auth.js'
import { getAllowedOrigin, getCorsHeaders, json, withCors } from './lib/http.js'
import { analyzeSuitcaseImage, generatePackingStrategy, predictItemMetrics } from './services/aiService.js'
import { createChatResponse } from './services/chatService.js'
import { transcribeAudio } from './services/transcriptionService.js'
import { getDestinationThumbnail } from './services/thumbnailService.js'
import {
    GuestLimitError,
    createGuestItem,
    createGuestTrip,
    deleteGuestData,
    deleteRegisteredAccountData,
    mergeGuestData,
    releaseGuestUsage,
    reserveGuestUsage,
} from './services/guestService.js'

const MAX_SUITCASE_IMAGE_BYTES = 20 * 1024 * 1024
const MAX_MULTIPART_REQUEST_BYTES = MAX_SUITCASE_IMAGE_BYTES + (1024 * 1024)
const MAX_CHAT_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_AUDIO_BYTES = 12 * 1024 * 1024
const CHAT_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const AUDIO_TYPES = new Set([
    'audio/flac',
    'audio/m4a',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'video/mp4',
])

const itemMetricsSchema = z.object({
    name: z.string().trim().min(1).max(200),
    quantity: z.coerce.number().int().positive().max(1000),
}).strict()

const dimensionSchema = z.object({
    lengthCm: z.coerce.number().positive(),
    widthCm: z.coerce.number().positive(),
    heightCm: z.coerce.number().positive(),
})

const strategySchema = z.object({
    items: z.array(z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        category: z.string().optional().default(''),
        quantity: z.coerce.number().positive().default(1),
        suitcaseId: z.string().optional().default(''),
        weight: z.unknown().optional(),
        dimensions: z.unknown().optional(),
    })).max(500),
    suitcases: z.array(z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        dimensions: dimensionSchema,
    })).max(100),
}).strict()

const thumbnailSchema = z.object({
    destination: z.string().trim().min(1).max(200),
}).strict()

const chatSchema = z.object({
    tripId: z.string().trim().min(1).max(200),
    messageId: z.string().uuid(),
    message: z.string().trim().min(1).max(2000),
}).strict()

const chatImageSchema = z.object({
    tripId: z.string().trim().min(1).max(200),
    messageId: z.string().uuid(),
    message: z.string().trim().max(2000),
}).strict()

const guestTripSchema = z.object({
    destination: z.string().trim().min(1).max(200),
    startDate: z.string().max(100).optional().default(''),
    endDate: z.string().max(100).optional().default(''),
    tripPurpose: z.string().max(100).optional().default(''),
    airline: z.string().max(100).optional().default(''),
    flightClass: z.string().max(100).optional().default(''),
    baggageLimit: z.coerce.number().positive(),
}).strict()

const guestItemSchema = z.object({
    tripId: z.string().min(1),
    name: z.string().trim().min(1).max(200),
    category: z.string().max(100).optional().default('Uncategorized'),
    quantity: z.coerce.number().int().positive().max(1000),
    suitcaseId: z.string().optional().default(''),
}).strict()

const deleteAccountSchema = z.object({
    email: z.string().trim().email().max(320),
}).strict()

const readJson = async (request, schema) => {
    let body

    try {
        body = await request.json()
    } catch {
        throw new Response(JSON.stringify({ message: 'Request body must be valid JSON.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
    }

    const result = schema.safeParse(body)

    if (!result.success) {
        throw new Response(JSON.stringify({
            message: 'Invalid request body.',
            issues: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
    }

    return result.data
}

const enforceRateLimit = async (limiter, key) => {
    if (!limiter) {
        return
    }

    const result = await limiter.limit({ key })

    if (!result.success) {
        throw json({ message: 'Too many requests. Please try again shortly.' }, 429, {
            'Retry-After': '60',
        })
    }
}

const createHandler = ({
    verifyToken = verifyFirebaseIdToken,
    metricsProvider = predictItemMetrics,
    strategyProvider = generatePackingStrategy,
    visionProvider = analyzeSuitcaseImage,
    thumbnailProvider = getDestinationThumbnail,
    chatProvider = createChatResponse,
    transcriptionProvider = transcribeAudio,
} = {}) => async (request, env, executionContext) => {
    const startedAt = Date.now()
    const requestId = request.headers.get('cf-ray') ?? crypto.randomUUID()
    const { pathname } = new URL(request.url)
    let status = 500
    let provider = ''
    let source = ''

    try {
        const origin = request.headers.get('Origin')

        if (origin && !getAllowedOrigin(request, env)) {
            status = 403
            return json({ message: 'Origin is not allowed.' }, status)
        }

        if (request.method === 'OPTIONS') {
            status = 204
            return new Response(null, { status, headers: getCorsHeaders(request, env) })
        }

        if (request.method === 'GET' && pathname === '/health') {
            status = 200
            return withCors(json({ ok: true }), request, env)
        }

        const knownPaths = new Set([
            '/v1/ai/item-metrics',
            '/v1/ai/packing-strategy',
            '/v1/ai/suitcase-vision',
            '/v1/ai/chat',
            '/v1/ai/transcribe',
            '/v1/destinations/thumbnail',
            '/v1/guest/trips',
            '/v1/guest/items',
            '/v1/auth/merge-guest',
            '/v1/auth/delete-guest',
            '/v1/auth/delete-account',
        ])

        if (!knownPaths.has(pathname)) {
            status = 404
            return withCors(json({ message: 'Not found.' }, status), request, env)
        }

        if (request.method !== 'POST') {
            status = 405
            return withCors(json({ message: 'Method not allowed.' }, status, { Allow: 'POST' }), request, env)
        }

        let user

        try {
            user = await verifyToken(request, env)
            await verifyFirebaseAppCheckToken(request, env)
        } catch {
            status = 401
            return withCors(json({ message: 'Unauthorized. Invalid or missing token.' }, status), request, env)
        }

        if (pathname === '/v1/auth/merge-guest') {
            if (user.isAnonymous) throw new Error('Destination account must be registered.')
            const guestAuthorization = request.headers.get('X-Guest-Authorization') ?? ''
            const [scheme, guestToken] = guestAuthorization.split(' ')
            const guestUser = await verifyFirebaseTokenString(scheme === 'Bearer' ? guestToken : '', env)
            if (!guestUser.isAnonymous) throw new Error('Source account must be anonymous.')
            status = 200
            return withCors(json(await mergeGuestData({ env, guestUid: guestUser.uid, destinationUid: user.uid })), request, env)
        }

        if (pathname === '/v1/auth/delete-guest') {
            if (!user.isAnonymous) throw new Error('Only guest accounts can use this endpoint.')
            status = 200
            return withCors(json(await deleteGuestData({ env, uid: user.uid })), request, env)
        }

        if (pathname === '/v1/auth/delete-account') {
            if (user.isAnonymous) throw new Error('Guest accounts must use the guest deletion endpoint.')
            const input = await readJson(request, deleteAccountSchema)
            if (!user.email || input.email.toLowerCase() !== user.email.trim().toLowerCase()) {
                status = 400
                return withCors(json({ message: 'The confirmation email does not match this account.' }, status), request, env)
            }
            status = 200
            return withCors(json(await deleteRegisteredAccountData({ env, uid: user.uid })), request, env)
        }

        if (pathname === '/v1/guest/trips' || pathname === '/v1/guest/items') {
            if (!user.isAnonymous) throw new Error('This endpoint is only for guest accounts.')
            if (pathname === '/v1/guest/trips') {
                const trip = await readJson(request, guestTripSchema)
                status = 201
                return withCors(json(await createGuestTrip({ env, uid: user.uid, trip })), request, env)
            }
            const item = await readJson(request, guestItemSchema)
            status = 201
            return withCors(json(await createGuestItem({ env, uid: user.uid, item, executionContext })), request, env)
        }

        if (pathname.startsWith('/v1/ai/')) {
            await enforceRateLimit(env.AI_RATE_LIMITER, user.uid)
        } else {
            await enforceRateLimit(env.THUMBNAIL_RATE_LIMITER, user.uid)
        }

        if (pathname === '/v1/ai/item-metrics') {
            if (user.isAnonymous) throw new GuestLimitError('items', 'Guest item predictions are created with the item itself.')
            const input = await readJson(request, itemMetricsSchema)
            const result = await metricsProvider({ env, ...input })
            provider = result.meta?.provider ?? 'openai'
            source = result.meta?.source ?? 'unknown'
            status = 200
            return withCors(json({ weight: result.weight, dimensions: result.dimensions }), request, env)
        }

        if (pathname === '/v1/ai/packing-strategy') {
            const input = await readJson(request, strategySchema)
            if (user.isAnonymous) await reserveGuestUsage(env, user.uid, 'planGenerations', 'packing_plan')
            let result
            try {
                result = await strategyProvider({ env, ...input })
            } catch (error) {
                if (user.isAnonymous) await releaseGuestUsage(env, user.uid, 'planGenerations').catch(() => {})
                throw error
            }
            provider = result.meta?.provider ?? 'openai'
            source = result.meta?.source ?? 'unknown'
            status = 200
            return withCors(json(result), request, env)
        }

        if (pathname === '/v1/ai/suitcase-vision') {
            if (user.isAnonymous) throw new GuestLimitError('suitcase_scan', 'Create an account to use suitcase photo analysis.')
            const contentLength = Number(request.headers.get('Content-Length'))

            if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_REQUEST_BYTES) {
                status = 413
                return withCors(json({ message: 'Suitcase image must be 20 MiB or smaller.' }, status), request, env)
            }

            let formData

            try {
                formData = await request.formData()
            } catch {
                status = 400
                return withCors(json({ message: 'Request body must be valid multipart form data.' }, status), request, env)
            }
            const image = formData.get('image')

            if (!image || typeof image.arrayBuffer !== 'function') {
                status = 400
                return withCors(json({ message: 'Suitcase image is required.' }, status), request, env)
            }

            if (image.size > MAX_SUITCASE_IMAGE_BYTES) {
                status = 413
                return withCors(json({ message: 'Suitcase image must be 20 MiB or smaller.' }, status), request, env)
            }

            if (!String(image.type).startsWith('image/')) {
                status = 400
                return withCors(json({ message: 'Uploaded file must be an image.' }, status), request, env)
            }

            const result = await visionProvider({
                env,
                imageBytes: await image.arrayBuffer(),
                mimeType: image.type || 'image/jpeg',
            })
            provider = result.meta?.provider ?? 'openai'
            source = result.meta?.source ?? 'unknown'
            status = 200
            return withCors(json({ prediction: result.prediction }), request, env)
        }

        if (pathname === '/v1/ai/chat') {
            const contentType = request.headers.get('Content-Type') ?? ''
            let input
            let imageBytes
            let imageMimeType

            if (contentType.includes('multipart/form-data')) {
                const contentLength = Number(request.headers.get('Content-Length'))
                if (Number.isFinite(contentLength) && contentLength > MAX_CHAT_IMAGE_BYTES + (512 * 1024)) {
                    status = 413
                    return withCors(json({ message: 'Chat photo must be 5 MB or smaller.' }, status), request, env)
                }

                let formData
                try {
                    formData = await request.formData()
                } catch {
                    status = 400
                    return withCors(json({ message: 'Request body must be valid multipart form data.' }, status), request, env)
                }
                const image = formData.get('image')
                const parsedInput = chatImageSchema.safeParse({
                    tripId: formData.get('tripId'),
                    messageId: formData.get('messageId'),
                    message: formData.get('message') ?? '',
                })
                if (!parsedInput.success) {
                    status = 400
                    return withCors(json({ message: 'Invalid chat photo request.' }, status), request, env)
                }
                input = parsedInput.data
                if (!image || typeof image.arrayBuffer !== 'function') {
                    status = 400
                    return withCors(json({ message: 'Chat photo is required.' }, status), request, env)
                }
                if (image.size > MAX_CHAT_IMAGE_BYTES) {
                    status = 413
                    return withCors(json({ message: 'Chat photo must be 5 MB or smaller.' }, status), request, env)
                }
                if (!CHAT_IMAGE_TYPES.has(image.type)) {
                    status = 400
                    return withCors(json({ message: 'Chat photos must be JPEG, PNG, or WebP.' }, status), request, env)
                }
                imageBytes = await image.arrayBuffer()
                imageMimeType = image.type
            } else {
                input = await readJson(request, chatSchema)
            }
            const result = await chatProvider({
                env,
                uid: user.uid,
                isAnonymous: user.isAnonymous,
                executionContext,
                imageBytes,
                imageMimeType,
                ...input,
            })
            provider = result.meta?.provider ?? 'openai'
            source = result.meta?.source ?? 'ai'
            status = 200
            return withCors(json({ message: result.message, actions: result.actions }), request, env)
        }

        if (pathname === '/v1/ai/transcribe') {
            const contentLength = Number(request.headers.get('Content-Length'))
            if (Number.isFinite(contentLength) && contentLength > MAX_AUDIO_BYTES + (512 * 1024)) {
                status = 413
                return withCors(json({ message: 'Voice recordings must be one minute or less.' }, status), request, env)
            }

            let formData
            try {
                formData = await request.formData()
            } catch {
                status = 400
                return withCors(json({ message: 'Request body must be valid multipart form data.' }, status), request, env)
            }
            const audio = formData.get('audio')
            if (!audio || typeof audio.arrayBuffer !== 'function') {
                status = 400
                return withCors(json({ message: 'A voice recording is required.' }, status), request, env)
            }
            if (audio.size > MAX_AUDIO_BYTES) {
                status = 413
                return withCors(json({ message: 'Voice recordings must be one minute or less.' }, status), request, env)
            }
            const mimeType = String(audio.type).split(';')[0].toLowerCase()
            if (!AUDIO_TYPES.has(mimeType)) {
                status = 400
                return withCors(json({ message: 'This audio format is not supported.' }, status), request, env)
            }

            const result = await transcriptionProvider({
                env,
                audioBytes: await audio.arrayBuffer(),
                mimeType,
                filename: audio.name || 'voice-message.webm',
            })
            provider = result.meta?.provider ?? 'openai'
            source = result.meta?.source ?? 'ai'
            status = 200
            return withCors(json({ text: result.text }), request, env)
        }

        const input = await readJson(request, thumbnailSchema)
        const result = await thumbnailProvider({ env, ...input })
        provider = 'pexels'
        source = result.source ?? 'unknown'
        status = 200
        return withCors(json({ thumbnailUrl: result.thumbnailUrl }), request, env)
    } catch (error) {
        if (error instanceof Response) {
            status = error.status
            return withCors(error, request, env)
        }

        status = Number(error?.status) || 502
        return withCors(json({
            message: error?.message || 'An upstream service is unavailable.',
            ...(error?.code ? { code: error.code } : {}),
            ...(error?.feature ? { feature: error.feature } : {}),
        }, status), request, env)
    } finally {
        console.info(JSON.stringify({
            requestId,
            path: pathname,
            status,
            provider: provider || undefined,
            source: source || undefined,
            elapsedMs: Date.now() - startedAt,
        }))
    }
}

const handler = createHandler()

export default {
    fetch: handler,
}
