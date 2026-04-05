import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { apiDelete, apiPatch, apiPost } from './apiClient'

const createItem = async (_uid, tripId, itemData) => {
    const data = await apiPost(`/api/trips/${tripId}/items`, { itemData })
    const itemId = data?.item?.id

    if (!itemId) {
        return itemId
    }

    try {
        await apiPatch(`/api/items/${itemId}/metrics`)
    } catch (error) {
        console.error('Failed to predict item metrics', error)
    }

    return itemId
}

const subscribeToTripItems = (uid, tripId, onNext, onError) => {

    if(!uid || !tripId) {
        onNext([])
        return () => {}
    }

    const itemsQuery = query(
        collection(db, 'items'),
        where('userId', '==', uid),
        where('tripId', '==', tripId),
    )

    return onSnapshot(
        itemsQuery,
        (snapshot) => {
            const items = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))

            onNext(items)
        },
        (error) => {
            onError?.(error)
        },
    )
    
}

const updateItemChecked = async (itemId, checked) => {
    await apiPatch(`/api/items/${itemId}/checked`, { checked })
}

const updateItemManualMetrics = async (itemId, { weightKg, lengthCm, widthCm, heightCm }) => {
    await apiPatch(`/api/items/${itemId}/manual-metrics`, {
        weight: {
            weightKg,
        },
        dimensions: {
            lengthCm,
            widthCm,
            heightCm,
        },
    })
}

const removeItem = async (itemId) => {
    await apiDelete(`/api/items/${itemId}`)
}

const removeTripItems = async (_uid, tripId) => {
    if (!tripId) {
        return
    }

    await apiDelete(`/api/trips/${tripId}/items`)
}

export {
    createItem,
    subscribeToTripItems,
    updateItemChecked,
    updateItemManualMetrics,
    removeItem,
    removeTripItems,
}
