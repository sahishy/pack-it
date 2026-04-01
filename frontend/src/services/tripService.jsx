import { FALLBACK_TRIP_THUMBNAIL } from '../utils/tripUtils'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { apiDelete, apiPatch, apiPost } from './apiClient'

const getThumbnailUrl = async () => FALLBACK_TRIP_THUMBNAIL

const createTrip = async (_uid, tripData) => {
    const data = await apiPost('/api/trips', { tripData })
    return data?.trip?.id
}

const subscribeToUserTrips = (uid, onNext, onError) => {
    if (!uid) {
        onNext([])
        return () => {}
    }

    const tripsQuery = query(
        collection(db, 'trips'),
        where('userId', '==', uid),
    )

    return onSnapshot(
        tripsQuery,
        (snapshot) => {
            const trips = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))

            onNext(trips)
        },
        (error) => {
            onError?.(error)
        },
    )
}

const setTripPackedStatus = async (tripId, packed) => {
    if (!tripId) {
        return
    }

    await apiPatch(`/api/trips/${tripId}/packed`, { packed: Boolean(packed) })
}

const updateTrip = async (tripId, tripData) => {
    if (!tripId) {
        throw new Error('Trip not found.')
    }

    await apiPatch(`/api/trips/${tripId}`, { tripData })
}

const deleteTrip = async (tripId) => {
    if (!tripId) {
        return
    }

    await apiDelete(`/api/trips/${tripId}`)
}

export {
    getThumbnailUrl,
    createTrip,
    subscribeToUserTrips,
    setTripPackedStatus,
    updateTrip,
    deleteTrip,
}
