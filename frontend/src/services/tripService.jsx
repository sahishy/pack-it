import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { FALLBACK_TRIP_THUMBNAIL } from '../utils/tripUtils'
import { commitInChunks } from './firestoreBatchService'
import { workerPost } from './workerClient'
import { auth } from '../lib/firebase'

const getThumbnailUrl = async (destination) => {
    if (!destination) {
        return FALLBACK_TRIP_THUMBNAIL
    }

    try {
        const data = await workerPost('/v1/destinations/thumbnail', { destination })
        return data?.thumbnailUrl || FALLBACK_TRIP_THUMBNAIL
    } catch {
        return FALLBACK_TRIP_THUMBNAIL
    }
}

const createTrip = async (uid, tripData) => {
    if (auth.currentUser?.isAnonymous) {
        const result = await workerPost('/v1/guest/trips', tripData)
        return result.id
    }

    const thumbnailUrl = await getThumbnailUrl(tripData.destination)
    const tripRef = await addDoc(collection(db, 'trips'), {
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })

    return tripRef.id
}

const subscribeToUserTrips = (uid, onNext, onError) => {
    if (!uid) {
        onNext([])
        return () => {}
    }

    const tripsQuery = query(collection(db, 'trips'), where('userId', '==', uid))

    return onSnapshot(tripsQuery, (snapshot) => {
        onNext(snapshot.docs.map((tripDoc) => ({ id: tripDoc.id, ...tripDoc.data() })))
    }, onError)
}

const setTripPackedStatus = async (tripId, packed) => {
    if (!tripId) return

    await updateDoc(doc(db, 'trips', tripId), {
        packed: Boolean(packed),
        updatedAt: serverTimestamp(),
    })
}

const updateTrip = async (tripId, tripData) => {
    if (!tripId) throw new Error('Trip not found.')

    const payload = {
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        tripPurpose: tripData.tripPurpose,
        airline: tripData.airline,
        flightClass: tripData.flightClass,
        baggageLimit: Number(tripData.baggageLimit),
        updatedAt: serverTimestamp(),
    }

    if (tripData.destination) {
        payload.thumbnailUrl = await getThumbnailUrl(tripData.destination)
    }

    await updateDoc(doc(db, 'trips', tripId), payload)
}

const deleteTrip = async (uid, tripId) => {
    if (!uid || !tripId) return

    const [itemsSnapshot, plansSnapshot, chatMessagesSnapshot] = await Promise.all([
        getDocs(query(
            collection(db, 'items'),
            where('userId', '==', uid),
            where('tripId', '==', tripId),
        )),
        getDocs(query(
            collection(db, 'plans'),
            where('userId', '==', uid),
            where('tripId', '==', tripId),
        )),
        getDocs(query(
            collection(db, 'chatMessages'),
            where('userId', '==', uid),
            where('tripId', '==', tripId),
        )),
    ])

    const dependentReferences = [
        ...itemsSnapshot.docs.map((itemDoc) => itemDoc.ref),
        ...plansSnapshot.docs.map((planDoc) => planDoc.ref),
        ...chatMessagesSnapshot.docs.map((messageDoc) => messageDoc.ref),
    ]

    await commitInChunks(dependentReferences, (batch, reference) => batch.delete(reference))
    await deleteDoc(doc(db, 'trips', tripId))
}

export {
    createTrip,
    deleteTrip,
    getThumbnailUrl,
    setTripPackedStatus,
    subscribeToUserTrips,
    updateTrip,
}
