import OpenAI from 'openai'
import { z } from 'zod'
import {
    createAdminDocument,
    getAdminDocument,
    queryAdminDocuments,
    updateAdminDocument,
} from '../lib/firebaseAdmin.js'
import { predictItemMetrics } from './aiService.js'
import { createGuestItem, reserveGuestUsage } from './guestService.js'

const CHAT_MODEL = 'gpt-5.4-nano'
const MAX_TOOL_ROUNDS = 2
const ITEM_CATEGORIES = [
    'Tops',
    'Bottoms',
    'Outerwear',
    'Footwear',
    'Underwear',
    'Accessories',
    'Toiletries',
    'Electronics',
    'Uncategorized',
]

const addItemArgumentsSchema = z.object({
    name: z.string().trim().min(1).max(200),
    quantity: z.number().int().positive().max(100),
    category: z.enum(ITEM_CATEGORIES),
    suitcaseId: z.string().nullable(),
}).strict()

const failedMetrics = {
    weight: { success: false, weightKg: -1, confidence: 0, reason: 'Server failure' },
    dimensions: {
        success: false,
        lengthCm: -1,
        widthCm: -1,
        heightCm: -1,
        confidence: 0,
        orientationAssumption: '',
        reason: 'Server failure',
    },
}

const assertOwnedTrip = async (env, uid, tripId) => {
    const trip = await getAdminDocument(env, 'trips', tripId)

    if (!trip || trip.userId !== uid) {
        const error = new Error('Trip not found.')
        error.status = 404
        throw error
    }

    return trip
}

const getTripContext = async (env, uid, tripId) => {
    const [trip, suitcases, items] = await Promise.all([
        assertOwnedTrip(env, uid, tripId),
        queryAdminDocuments(env, 'suitcases', [['userId', uid]], 50),
        queryAdminDocuments(env, 'items', [['userId', uid], ['tripId', tripId]], 100),
    ])

    return {
        trip,
        suitcases,
        items,
    }
}

const saveItemMetrics = async (env, itemId, name, quantity) => {
    let metrics = failedMetrics

    try {
        const prediction = await predictItemMetrics({ env, name, quantity })
        metrics = {
            weight: prediction?.weight ?? failedMetrics.weight,
            dimensions: prediction?.dimensions ?? failedMetrics.dimensions,
        }
    } catch {
        // Persist the sentinel below so the client does not remain in a loading state.
    }

    await updateAdminDocument(env, 'items', itemId, {
        ...metrics,
        updatedAt: new Date(),
    })
}

const addPackingItem = async ({ env, uid, tripId, context, args, executionContext, operationId, isAnonymous }) => {
    const input = addItemArgumentsSchema.parse(args)
    const requestedSuitcase = input.suitcaseId
        ? context.suitcases.find((suitcase) => suitcase.id === input.suitcaseId)
        : null
    const suitcase = requestedSuitcase ?? context.suitcases[0] ?? null

    if (input.suitcaseId && !requestedSuitcase) {
        throw new Error('The selected suitcase is not available for this user.')
    }

    if (suitcase) {
        const ownedSuitcase = await getAdminDocument(env, 'suitcases', suitcase.id)
        if (!ownedSuitcase || ownedSuitcase.userId !== uid) {
            throw new Error('The selected suitcase is not available for this user.')
        }
    }

    await assertOwnedTrip(env, uid, tripId)
    const itemId = operationId
    const existingItem = await getAdminDocument(env, 'items', itemId)

    if (existingItem) {
        if (existingItem.userId !== uid || existingItem.tripId !== tripId) {
            throw new Error('This item operation conflicts with another request.')
        }
        return {
            success: true,
            itemId,
            itemName: existingItem.name,
            quantity: existingItem.quantity,
            suitcaseId: existingItem.suitcaseId ?? '',
            suitcaseName: context.suitcases.find(({ id }) => id === existingItem.suitcaseId)?.name ?? '',
        }
    }

    if (isAnonymous) {
        await createGuestItem({
            env,
            uid,
            executionContext,
            itemId,
            item: {
                tripId,
                name: input.name,
                category: input.category,
                quantity: input.quantity,
                suitcaseId: suitcase?.id ?? '',
            },
        })
    } else {
        await createAdminDocument(env, 'items', itemId, {
        userId: uid,
        tripId,
        name: input.name,
        category: input.category,
        quantity: input.quantity,
        suitcaseId: suitcase?.id ?? '',
        weight: null,
        dimensions: null,
        checked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        })
        const metricsPromise = saveItemMetrics(env, itemId, input.name, input.quantity)
        if (executionContext?.waitUntil) {
            executionContext.waitUntil(metricsPromise)
        } else {
            await metricsPromise
        }
    }

    return {
        success: true,
        itemId,
        itemName: input.name,
        quantity: input.quantity,
        suitcaseId: suitcase?.id ?? '',
        suitcaseName: suitcase?.name ?? '',
    }
}

const buildInstructions = ({ trip, suitcases, items }) => `
You are Pack-It, a concise and practical travel-packing assistant.
Answer general travel and packing questions helpfully. Keep replies short: usually 1-4 sentences, never a long essay unless the user explicitly asks.
When the user asks to add an item to their packing list, use add_packing_item. Do not claim an item was added unless the tool succeeds.
If the user names a suitcase, match it to the available suitcase list. If they do not name one, pass null and the app will choose one.
Ask a brief clarification only when a required detail cannot reasonably be inferred. Never expose internal document IDs.

Current trip: ${JSON.stringify({
    destination: trip.destination ?? '',
    purpose: trip.tripPurpose ?? '',
    startDate: trip.startDate ?? '',
    endDate: trip.endDate ?? '',
})}
Available suitcases: ${JSON.stringify(suitcases.map(({ id, name }) => ({ id, name })))}
Current packing list: ${JSON.stringify(items.map(({ name, quantity, category, suitcaseId }) => ({ name, quantity, category, suitcaseId })))}
`

const getTools = (suitcases) => [{
    type: 'function',
    name: 'add_packing_item',
    description: 'Add one kind of item to the current trip packing list. Use this whenever the user asks to add, pack, include, or put an item on their list.',
    strict: true,
    parameters: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Short singular item name.' },
            quantity: { type: 'integer', minimum: 1, maximum: 100 },
            category: { type: 'string', enum: ITEM_CATEGORIES },
            suitcaseId: {
                type: ['string', 'null'],
                description: `Exact suitcase ID when the user specifies one, otherwise null. Available: ${suitcases.map(({ id, name }) => `${name} (${id})`).join(', ') || 'none'}.`,
            },
        },
        required: ['name', 'quantity', 'category', 'suitcaseId'],
        additionalProperties: false,
    },
}]

const createChatResponse = async ({ env, uid, tripId, messageId, message, executionContext, isAnonymous = false }) => {
    const context = await getTripContext(env, uid, tripId)
    const assistantMessageId = `${messageId}_assistant`
    const [existingUserMessage, existingAssistantMessage] = await Promise.all([
        getAdminDocument(env, 'chatMessages', messageId),
        getAdminDocument(env, 'chatMessages', assistantMessageId),
    ])

    if (existingUserMessage
        && (existingUserMessage.userId !== uid
            || existingUserMessage.tripId !== tripId
            || existingUserMessage.role !== 'user'
            || existingUserMessage.content !== message)) {
        throw new Error('This message ID is already in use.')
    }

    if (existingAssistantMessage) {
        if (existingAssistantMessage.userId !== uid || existingAssistantMessage.tripId !== tripId) {
            throw new Error('This message ID is already in use.')
        }
        return {
            message: existingAssistantMessage.content,
            actions: existingAssistantMessage.actions ?? [],
            meta: { provider: 'openai', model: CHAT_MODEL, source: 'saved' },
        }
    }

    if (isAnonymous && !existingUserMessage) {
        await reserveGuestUsage(env, uid, 'chatRequests', 'chat')
    }

    if (!existingUserMessage) {
        try {
            await createAdminDocument(env, 'chatMessages', messageId, {
                userId: uid,
                tripId,
                role: 'user',
                content: message,
                actions: [],
                createdAt: new Date(),
            })
        } catch (error) {
            if (error.status !== 409) throw error
        }
    }

    const savedMessages = await queryAdminDocuments(
        env,
        'chatMessages',
        [['userId', uid], ['tripId', tripId]],
        500,
        [{ fieldPath: 'createdAt', direction: 'ASCENDING' }],
    )
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
    const tools = getTools(context.suitcases)
    const input = savedMessages
        .slice(-12)
        .filter(({ role, content }) => (role === 'user' || role === 'assistant') && content)
        .map(({ role, content }) => ({ role, content }))
    const actions = []
    const request = () => client.responses.create({
        model: CHAT_MODEL,
        instructions: buildInstructions(context),
        input,
        tools,
        tool_choice: 'auto',
        parallel_tool_calls: false,
        reasoning: { effort: 'none' },
        text: { verbosity: 'low' },
        max_output_tokens: 500,
        store: false,
        safety_identifier: uid,
    })

    let response = await request()

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        const toolCalls = response.output.filter((item) => item.type === 'function_call')
        if (!toolCalls.length) break

        input.push(...response.output)
        for (const [toolIndex, toolCall] of toolCalls.entries()) {
            let result
            try {
                if (toolCall.name !== 'add_packing_item') {
                    throw new Error('Unknown tool.')
                }
                result = await addPackingItem({
                    env,
                    uid,
                    tripId,
                    context,
                    args: JSON.parse(toolCall.arguments),
                    executionContext,
                    operationId: `${messageId}_${round}_${toolIndex}`,
                    isAnonymous,
                })
                actions.push({
                    type: 'item_added',
                    itemId: result.itemId,
                    label: result.suitcaseName
                        ? `Added ${result.quantity}× ${result.itemName} to ${result.suitcaseName}`
                        : `Added ${result.quantity}× ${result.itemName} to the packing list`,
                })
            } catch (error) {
                if (error?.code === 'guest_upgrade_required') throw error
                result = { success: false, error: error.message }
            }

            input.push({
                type: 'function_call_output',
                call_id: toolCall.call_id,
                output: JSON.stringify(result),
            })
        }
        response = await request()
    }

    const responseMessage = response.output_text?.trim() || (actions.length ? 'Done.' : 'I could not finish that request.')
    const assistantDocument = {
        userId: uid,
        tripId,
        role: 'assistant',
        content: responseMessage,
        actions,
        model: CHAT_MODEL,
        createdAt: new Date(),
    }

    try {
        await createAdminDocument(env, 'chatMessages', assistantMessageId, assistantDocument)
    } catch (error) {
        if (error.status !== 409) throw error
    }

    return {
        message: responseMessage,
        actions,
        meta: { provider: 'openai', model: CHAT_MODEL, source: 'ai' },
    }
}

export { createChatResponse }
