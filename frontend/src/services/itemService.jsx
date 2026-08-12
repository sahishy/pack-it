import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { invalidateTripPlan } from './planService'
import { workerPost } from './workerClient'

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

const createItem = async (uid, tripId, itemData) => {
    if (auth.currentUser?.isAnonymous) {
        const result = await workerPost('/v1/guest/items', { tripId, ...itemData })
        return result.id
    }

    const itemRef = await addDoc(collection(db, 'items'), {
        userId: uid,
        tripId,
        name: itemData.name,
        category: itemData.category,
        quantity: Number(itemData.quantity),
        suitcaseId: typeof itemData.suitcaseId === 'string' ? itemData.suitcaseId : '',
        weight: null,
        dimensions: null,
        checked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })

    void (async () => {
        let metrics = failedMetrics

        try {
            metrics = await workerPost('/v1/ai/item-metrics', {
                name: itemData.name,
                quantity: Number(itemData.quantity),
            })
        } catch (error) {
            console.error('Failed to predict item metrics', error)
        }

        try {
            await updateDoc(itemRef, {
                weight: metrics?.weight ?? failedMetrics.weight,
                dimensions: metrics?.dimensions ?? failedMetrics.dimensions,
                updatedAt: serverTimestamp(),
            })
        } catch (error) {
            if (error?.code !== 'not-found') {
                console.error('Failed to save item metrics', error)
            }
        }
    })()

    return itemRef.id
}

const subscribeToTripItems = (uid, tripId, onNext, onError) => {
    if (!uid || !tripId) {
        onNext([])
        return () => {}
    }

    const itemsQuery = query(
        collection(db, 'items'),
        where('userId', '==', uid),
        where('tripId', '==', tripId),
    )

    return onSnapshot(itemsQuery, (snapshot) => {
        onNext(snapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() })))
    }, onError)
}

const updateItemChecked = async (itemId, checked) => {
    await updateDoc(doc(db, 'items', itemId), {
        checked: Boolean(checked),
        updatedAt: serverTimestamp(),
    })
}

const updateItemManualMetrics = async (uid, tripId, itemId, { weightKg, lengthCm, widthCm, heightCm }) => {
    const numbers = [weightKg, lengthCm, widthCm, heightCm].map(Number)

    if (numbers.some((value) => !Number.isFinite(value) || value <= 0)) {
        throw new Error('Weight and all dimensions must be greater than 0.')
    }

    await updateDoc(doc(db, 'items', itemId), {
        weight: {
            success: true,
            weightKg: Number(numbers[0].toFixed(2)),
            confidence: 1,
            reason: '',
        },
        dimensions: {
            success: true,
            lengthCm: Number(numbers[1].toFixed(2)),
            widthCm: Number(numbers[2].toFixed(2)),
            heightCm: Number(numbers[3].toFixed(2)),
            confidence: 1,
            orientationAssumption: 'Manual override',
            reason: '',
        },
        updatedAt: serverTimestamp(),
    })
    await invalidateTripPlan(uid, tripId)
}

const removeItem = async (uid, tripId, itemId) => {
    await deleteDoc(doc(db, 'items', itemId))
    await invalidateTripPlan(uid, tripId)
}

export {
    createItem,
    removeItem,
    subscribeToTripItems,
    updateItemChecked,
    updateItemManualMetrics,
}
