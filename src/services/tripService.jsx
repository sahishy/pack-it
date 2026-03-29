import {
    addDoc,
    collection,
    getFirestore,
    onSnapshot,
    query,
    where,
} from 'firebase/firestore'

const getThumbnailUrl = async () => {
    return 'https://placehold.co/600x400'
}

const createTrip = async (uid, tripData) => {

    const db = getFirestore()
    const tripsRef = collection(db, 'trips')

    const thumbnailUrl = await getThumbnailUrl(tripData)

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

export {
    getThumbnailUrl,
    createTrip,
    subscribeToUserTrips,
}
