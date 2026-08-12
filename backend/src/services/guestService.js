import {
    createAdminDocument,
    deleteAdminAuthUser,
    deleteAdminDocument,
    getAdminDocument,
    queryAdminDocuments,
    updateAdminDocument,
} from '../lib/firebaseAdmin.js'
import { predictItemMetrics } from './aiService.js'
import { FALLBACK_TRIP_THUMBNAIL, getDestinationThumbnail } from './thumbnailService.js'

const GUEST_LIMITS = {
    tripCreations: 1,
    itemAdditions: 20,
    planGenerations: 1,
    chatRequests: 10,
}

class GuestLimitError extends Error {
    constructor(feature, message) {
        super(message)
        this.status = 403
        this.code = 'guest_upgrade_required'
        this.feature = feature
    }
}

const defaultUsage = (uid) => ({
    uid,
    tripCreations: 0,
    itemAdditions: 0,
    planGenerations: 0,
    chatRequests: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
})

const getGuestUsage = async (env, uid) => {
    let usage = await getAdminDocument(env, 'guestUsage', uid)
    if (usage) return usage

    try {
        await createAdminDocument(env, 'guestUsage', uid, defaultUsage(uid))
    } catch (error) {
        if (error.status !== 409) throw error
    }
    usage = await getAdminDocument(env, 'guestUsage', uid)
    return usage
}

const adjustGuestUsage = async (env, uid, field, delta, feature = field) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const usage = await getGuestUsage(env, uid)
        const current = Number(usage?.[field]) || 0
        const next = Math.max(0, current + delta)
        const limit = GUEST_LIMITS[field]
        if (delta > 0 && Number.isFinite(limit) && next > limit) {
            throw new GuestLimitError(feature, 'Your guest trial limit has been reached. Create an account to continue.')
        }

        try {
            await updateAdminDocument(env, 'guestUsage', uid, {
                [field]: next,
                updatedAt: new Date(),
            }, { updateTime: usage._updateTime })
            return next
        } catch (error) {
            if (error.status !== 409 && error.status !== 412) throw error
        }
    }
    throw new Error('Unable to reserve guest usage.')
}

const reserveGuestUsage = (env, uid, field, feature) => adjustGuestUsage(env, uid, field, 1, feature)
const releaseGuestUsage = (env, uid, field) => adjustGuestUsage(env, uid, field, -1)

const createGuestTrip = async ({ env, uid, trip }) => {
    await reserveGuestUsage(env, uid, 'tripCreations', 'trips')
    const tripId = crypto.randomUUID()

    try {
        const thumbnail = await getDestinationThumbnail({ env, destination: trip.destination })
        await createAdminDocument(env, 'trips', tripId, {
            userId: uid,
            destination: trip.destination,
            startDate: trip.startDate ?? '',
            endDate: trip.endDate ?? '',
            thumbnailUrl: thumbnail?.thumbnailUrl || FALLBACK_TRIP_THUMBNAIL,
            tripPurpose: trip.tripPurpose ?? '',
            airline: trip.airline ?? '',
            flightClass: trip.flightClass ?? '',
            baggageLimit: Number(trip.baggageLimit),
            planId: null,
            packed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        return { id: tripId }
    } catch (error) {
        await releaseGuestUsage(env, uid, 'tripCreations').catch(() => {})
        throw error
    }
}

const assertGuestItemParents = async (env, uid, tripId, suitcaseId) => {
    const trip = await getAdminDocument(env, 'trips', tripId)
    if (!trip || trip.userId !== uid) throw new Error('Trip not found.')
    if (suitcaseId) {
        const suitcase = await getAdminDocument(env, 'suitcases', suitcaseId)
        if (!suitcase || suitcase.userId !== uid) throw new Error('Suitcase not found.')
    }
}

const createGuestItem = async ({ env, uid, item, executionContext, itemId = crypto.randomUUID() }) => {
    await assertGuestItemParents(env, uid, item.tripId, item.suitcaseId ?? '')
    await reserveGuestUsage(env, uid, 'itemAdditions', 'items')

    try {
        await createAdminDocument(env, 'items', itemId, {
            userId: uid,
            tripId: item.tripId,
            name: item.name,
            category: item.category || 'Uncategorized',
            quantity: Number(item.quantity),
            suitcaseId: item.suitcaseId ?? '',
            weight: null,
            dimensions: null,
            checked: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
    } catch (error) {
        await releaseGuestUsage(env, uid, 'itemAdditions').catch(() => {})
        throw error
    }

    const metricsPromise = predictItemMetrics({ env, name: item.name, quantity: Number(item.quantity) })
        .then((metrics) => updateAdminDocument(env, 'items', itemId, {
            weight: metrics.weight,
            dimensions: metrics.dimensions,
            updatedAt: new Date(),
        }))
        .catch(() => {})
    if (executionContext?.waitUntil) executionContext.waitUntil(metricsPromise)
    else await metricsPromise
    return { id: itemId }
}

const OWNED_COLLECTIONS = ['trips', 'suitcases', 'items', 'plans', 'chatMessages']

const mergeGuestData = async ({ env, guestUid, destinationUid }) => {
    if (guestUid === destinationUid) throw new Error('Accounts must be different.')
    let existingMerge = await getAdminDocument(env, 'accountMerges', guestUid)
    if (existingMerge?.destinationUid && existingMerge.destinationUid !== destinationUid) {
        throw new Error('This guest account was already merged elsewhere.')
    }
    if (existingMerge?.status === 'completed') {
        await deleteAdminAuthUser(env, guestUid)
        return { merged: true, counts: existingMerge.counts ?? {} }
    }

    if (!existingMerge) {
        try {
            await createAdminDocument(env, 'accountMerges', guestUid, {
                guestUid,
                destinationUid,
                status: 'merging',
                createdAt: new Date(),
                updatedAt: new Date(),
            })
        } catch (error) {
            if (error.status !== 409) throw error
            existingMerge = await getAdminDocument(env, 'accountMerges', guestUid)
            if (existingMerge?.destinationUid !== destinationUid) {
                throw new Error('This guest account was already merged elsewhere.')
            }
        }
    }

    const counts = {}
    for (const collectionName of OWNED_COLLECTIONS) {
        counts[collectionName] = 0
        while (true) {
            const documents = await queryAdminDocuments(env, collectionName, [['userId', guestUid]], 500)
            if (!documents.length) break
            counts[collectionName] += documents.length
            await Promise.all(documents.map((document) => updateAdminDocument(env, collectionName, document.id, {
                userId: destinationUid,
                updatedAt: new Date(),
            })))
        }
    }

    await Promise.all([
        deleteAdminDocument(env, 'users', guestUid).catch(() => {}),
        deleteAdminDocument(env, 'guestUsage', guestUid).catch(() => {}),
    ])
    await updateAdminDocument(env, 'accountMerges', guestUid, {
        status: 'completed',
        counts,
        updatedAt: new Date(),
    })
    await deleteAdminAuthUser(env, guestUid)
    return { merged: true, counts }
}

const deleteGuestData = async ({ env, uid }) => {
    for (const collectionName of OWNED_COLLECTIONS) {
        while (true) {
            const documents = await queryAdminDocuments(env, collectionName, [['userId', uid]], 500)
            if (!documents.length) break
            await Promise.all(documents.map((document) => deleteAdminDocument(env, collectionName, document.id)))
        }
    }
    await Promise.all([
        deleteAdminDocument(env, 'users', uid).catch(() => {}),
        deleteAdminDocument(env, 'guestUsage', uid).catch(() => {}),
    ])
    await deleteAdminAuthUser(env, uid)
    return { deleted: true }
}

const deleteRegisteredAccountData = async ({ env, uid }) => {
    for (const collectionName of OWNED_COLLECTIONS) {
        while (true) {
            const documents = await queryAdminDocuments(env, collectionName, [['userId', uid]], 500)
            if (!documents.length) break
            await Promise.all(documents.map((document) => deleteAdminDocument(env, collectionName, document.id)))
        }
    }
    while (true) {
        const mergeRecords = await queryAdminDocuments(env, 'accountMerges', [['destinationUid', uid]], 500)
        if (!mergeRecords.length) break
        await Promise.all(mergeRecords.map((record) => deleteAdminDocument(env, 'accountMerges', record.id)))
    }
    await deleteAdminDocument(env, 'users', uid).catch(() => {})
    await deleteAdminAuthUser(env, uid)
    return { deleted: true }
}

export {
    GuestLimitError,
    createGuestItem,
    createGuestTrip,
    deleteGuestData,
    deleteRegisteredAccountData,
    mergeGuestData,
    releaseGuestUsage,
    reserveGuestUsage,
}
