import { Router } from 'express'
import { db } from '../lib/firebaseAdmin.js'
import { serializeDoc } from '../utils/firestoreUtils.js'
import { getThumbnailUrl } from '../utils/tripUtils.js'

const tripsRouter = Router()

const getTripRef = (tripId) => db.collection('trips').doc(tripId)

const assertTripOwnership = async (tripId, uid) => {

    const tripRef = getTripRef(tripId)
    const snapshot = await tripRef.get()

    if(!snapshot.exists) {
        return { status: 404, message: 'Trip not found.' }
    }

    if(snapshot.data()?.userId !== uid) {
        return { status: 403, message: 'Forbidden.' }
    }

    return { tripRef, snapshot }
}

tripsRouter.get('/trips', async (req, res) => {

    const uid = req.user.uid
    const snapshot = await db.collection('trips').where('userId', '==', uid).get()
    const trips = snapshot.docs.map(serializeDoc)

    return res.json({ trips })

})

tripsRouter.post('/trips', async (req, res) => {

    const uid = req.user.uid
    const { tripData = {} } = req.body ?? {}

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

    const docRef = await db.collection('trips').add(payload)
    const snapshot = await docRef.get()

    return res.status(201).json({ trip: serializeDoc(snapshot) })

})

tripsRouter.patch('/trips/:tripId', async (req, res) => {

    const uid = req.user.uid
    const { tripId } = req.params
    const ownership = await assertTripOwnership(tripId, uid)

    if(!ownership.tripRef) {
        return res.status(ownership.status).json({ message: ownership.message })
    }

    const { tripData = {} } = req.body ?? {}
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

    if(tripData.destination) {
        payload.thumbnailUrl = await getThumbnailUrl(tripData.destination)
    }

    await ownership.tripRef.update(payload)
    const snapshot = await ownership.tripRef.get()

    return res.json({ trip: serializeDoc(snapshot) })

})

tripsRouter.patch('/trips/:tripId/packed', async (req, res) => {

    const uid = req.user.uid
    const { tripId } = req.params
    const { packed } = req.body ?? {}
    const ownership = await assertTripOwnership(tripId, uid)

    if(!ownership.tripRef) {
        return res.status(ownership.status).json({ message: ownership.message })
    }

    await ownership.tripRef.update({
        packed: Boolean(packed),
        updatedAt: new Date(),
    })

    const snapshot = await ownership.tripRef.get()
    return res.json({ trip: serializeDoc(snapshot) })

})

tripsRouter.delete('/trips/:tripId', async (req, res) => {

    const uid = req.user.uid
    const { tripId } = req.params
    const ownership = await assertTripOwnership(tripId, uid)

    if(!ownership.tripRef) {
        return res.status(ownership.status).json({ message: ownership.message })
    }

    await ownership.tripRef.delete()
    return res.status(204).send()

})

export default tripsRouter
