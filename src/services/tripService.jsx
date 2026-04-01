import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getFirestore,
    onSnapshot,
    query,
    updateDoc,
    where,
} from 'firebase/firestore'
import { FALLBACK_TRIP_THUMBNAIL } from '../utils/tripUtils'

const getThumbnailUrl = async (destination) => {

    const apiKey = import.meta.env.VITE_PEXELS_API_KEY
    const fallbackThumbnailUrl = FALLBACK_TRIP_THUMBNAIL

    if (!apiKey || !destination) {
        return fallbackThumbnailUrl
    }

    try {
        const params = new URLSearchParams({
            query: destination,
            orientation: 'landscape',
            per_page: '1',
        })

        const response = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
            headers: {
                Authorization: apiKey,
            },
        })

        if (!response.ok) {
            return fallbackThumbnailUrl
        }

        const data = await response.json()
        const firstPhoto = data?.photos?.[0]

        return firstPhoto?.src?.landscape ?? fallbackThumbnailUrl
    } catch {
        return fallbackThumbnailUrl
    }
}

const createTrip = async (uid, tripData) => {

    const db = getFirestore()
    const tripsRef = collection(db, 'trips')

    const thumbnailUrl = await getThumbnailUrl(tripData.destination)

    const payload = {
        userId: uid,
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        thumbnailUrl,
        tripPurpose: tripData.tripPurpose,
        airline: tripData.airline,
        flightClass: tripData.flightClass,
        baggageLimit: Number(tripData.baggageLimit),
        planId: null,
        packed: false,
        createdAt: new Date(),
    }

    const docRef = await addDoc(tripsRef, payload)
    return docRef.id

}

const subscribeToUserTrips = (uid, onNext, onError) => {

    const db = getFirestore()
    const tripsRef = collection(db, 'trips')
    const tripsQuery = query(tripsRef, where('userId', '==', uid))

    return onSnapshot(
        tripsQuery,
        (snapshot) => {
            const trips = snapshot.docs.map((tripDoc) => ({
                id: tripDoc.id,
                ...tripDoc.data(),
            }))

            onNext(trips)
        },
        onError,
    )

}

const setTripPackedStatus = async (tripId, packed) => {
    if (!tripId) {
        return
    }

    const db = getFirestore()
    const tripRef = doc(db, 'trips', tripId)

    await updateDoc(tripRef, {
        packed: Boolean(packed),
    })
}

const updateTrip = async (tripId, tripData) => {
    if (!tripId) {
        throw new Error('Trip not found.')
    }

    const db = getFirestore()
    const tripRef = doc(db, 'trips', tripId)

    const payload = {
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        tripPurpose: tripData.tripPurpose,
        airline: tripData.airline,
        flightClass: tripData.flightClass,
        baggageLimit: Number(tripData.baggageLimit),
        updatedAt: new Date(),
    }

    if (tripData.destination) {
        payload.thumbnailUrl = await getThumbnailUrl(tripData.destination)
    }

    await updateDoc(tripRef, payload)
}

const deleteTrip = async (tripId) => {
    if (!tripId) {
        return
    }

    const db = getFirestore()
    const tripRef = doc(db, 'trips', tripId)
    await deleteDoc(tripRef)
}

export {
    getThumbnailUrl,
    createTrip,
    subscribeToUserTrips,
    setTripPackedStatus,
    updateTrip,
    deleteTrip,
}
