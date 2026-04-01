import { collection, limit, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { apiDelete, apiPost } from './apiClient'

const subscribeToTripPlan = (uid, tripId, onNext, onError) => {
    if (!uid || !tripId) {
        onNext(null)
        return () => {}
    }

    const planQuery = query(
        collection(db, 'plans'),
        where('userId', '==', uid),
        where('tripId', '==', tripId),
        limit(1),
    )

    return onSnapshot(
        planQuery,
        (snapshot) => {
            if (snapshot.empty) {
                onNext(null)
                return
            }

            const planDoc = snapshot.docs[0]
            onNext({
                id: planDoc.id,
                ...planDoc.data(),
            })
        },
        (error) => {
            onError?.(error)
        },
    )
}

const generatePlanResult = async (_uid, trip, items) => {
    if (!trip?.id) {
        throw new Error('Trip not found.')
    }

    const data = await apiPost(`/api/trips/${trip.id}/plan/result`, { items })
    return data?.result ?? null
}

const generatePlanStrategy = async (_uid, tripId, items) => {
    if (!tripId) {
        throw new Error('Trip not found.')
    }

    const data = await apiPost(`/api/trips/${tripId}/plan/strategy`, { items })
    return data?.strategy ?? null
}

const deleteTripPlan = async (_uid, tripId) => {
    if (!tripId) {
        return
    }

    await apiDelete(`/api/trips/${tripId}/plan`)
}

export {
    subscribeToTripPlan,
    generatePlanResult,
    generatePlanStrategy,
    deleteTripPlan,
}