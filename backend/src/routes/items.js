import { Router } from 'express'
import { db } from '../lib/firebaseAdmin.js'
import { serializeDoc } from '../utils/firestoreUtils.js'
import { getPredictedItemMetrics } from '../utils/aiUtils.js'

const itemsRouter = Router()

const getTripById = async (tripId) => {

    const tripRef = db.collection('trips').doc(tripId)
    const snapshot = await tripRef.get()

    return { tripRef, snapshot }

}

const getItemRef = (itemId) => db.collection('items').doc(itemId)

itemsRouter.get('/trips/:tripId/items', async (req, res) => {

    const uid = req.user.uid
    const { tripId } = req.params

    const { snapshot: tripSnapshot } = await getTripById(tripId)

    if(!tripSnapshot.exists) {
        return res.status(404).json({ message: 'Trip not found.' })
    }

    if(tripSnapshot.data()?.userId !== uid) {
        return res.status(403).json({ message: 'Forbidden.' })
    }

    const snapshot = await db
        .collection('items')
        .where('userId', '==', uid)
        .where('tripId', '==', tripId)
        .get()

    const items = snapshot.docs.map(serializeDoc)

    return res.json({ items })

})

itemsRouter.post('/trips/:tripId/items', async (req, res) => {

    const uid = req.user.uid
    const { tripId } = req.params
    const { itemData = {} } = req.body ?? {}

    const { snapshot: tripSnapshot } = await getTripById(tripId)

    if(!tripSnapshot.exists) {
        return res.status(404).json({ message: 'Trip not found.' })
    }

    if(tripSnapshot.data()?.userId !== uid) {
        return res.status(403).json({ message: 'Forbidden.' })
    }

    const payload = {
        userId: uid,
        tripId,
        name: itemData.name,
        category: itemData.category,
        quantity: Number(itemData.quantity),
        weight: null,
        dimensions: null,
        checked: false,
        createdAt: new Date(),
    }

    const docRef = await db.collection('items').add(payload)
    const snapshot = await docRef.get()

    return res.status(201).json({ item: serializeDoc(snapshot) })

})

itemsRouter.patch('/items/:itemId/metrics', async (req, res) => {

    const uid = req.user.uid
    const { itemId } = req.params
    const itemRef = getItemRef(itemId)
    const snapshot = await itemRef.get()

    if(!snapshot.exists) {
        return res.status(404).json({ message: 'Item not found.' })
    }

    const item = snapshot.data() ?? {}

    if(item.userId !== uid) {
        return res.status(403).json({ message: 'Forbidden.' })
    }

    const aiCallStartedAt = Date.now()
    console.info('[AI][route] item-metrics.start', {
        route: 'PATCH /items/:itemId/metrics',
        uid,
        tripId: item.tripId,
        itemId,
    })

    const metricsPrediction = await getPredictedItemMetrics({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
    })

    console.info('[AI][route] item-metrics.success', {
        route: 'PATCH /items/:itemId/metrics',
        uid,
        tripId: item.tripId,
        itemId,
        elapsedMs: Date.now() - aiCallStartedAt,
    })

    await itemRef.update({
        weight: metricsPrediction.weight,
        dimensions: metricsPrediction.dimensions,
        updatedAt: new Date(),
    })

    const updated = await itemRef.get()
    return res.json({
        weight: metricsPrediction.weight,
        dimensions: metricsPrediction.dimensions,
        item: serializeDoc(updated),
    })

})

itemsRouter.patch('/items/:itemId/manual-metrics', async (req, res) => {

    const uid = req.user.uid
    const { itemId } = req.params
    const { weight = {}, dimensions = {} } = req.body ?? {}
    const itemRef = getItemRef(itemId)
    const snapshot = await itemRef.get()

    if(!snapshot.exists) {
        return res.status(404).json({ message: 'Item not found.' })
    }

    if(snapshot.data()?.userId !== uid) {
        return res.status(403).json({ message: 'Forbidden.' })
    }

    const nextWeightKg = Number(weight?.weightKg)
    const nextLengthCm = Number(dimensions?.lengthCm)
    const nextWidthCm = Number(dimensions?.widthCm)
    const nextHeightCm = Number(dimensions?.heightCm)

    if(!Number.isFinite(nextWeightKg) || nextWeightKg <= 0) {
        return res.status(400).json({ message: 'Weight must be greater than 0.' })
    }

    if(!Number.isFinite(nextLengthCm) || !Number.isFinite(nextWidthCm) || !Number.isFinite(nextHeightCm) || nextLengthCm <= 0 || nextWidthCm <= 0 || nextHeightCm <= 0) {
        return res.status(400).json({ message: 'All dimensions must be greater than 0.' })
    }

    await itemRef.update({
        weight: {
            success: true,
            weightKg: Number(nextWeightKg.toFixed(2)),
            confidence: 1,
            reason: '',
        },
        dimensions: {
            success: true,
            lengthCm: Number(nextLengthCm.toFixed(2)),
            widthCm: Number(nextWidthCm.toFixed(2)),
            heightCm: Number(nextHeightCm.toFixed(2)),
            confidence: 1,
            orientationAssumption: 'Manual override',
            reason: '',
        },
        updatedAt: new Date(),
    })

    const updated = await itemRef.get()
    return res.json({ item: serializeDoc(updated) })

})

itemsRouter.patch('/items/:itemId/checked', async (req, res) => {

    const uid = req.user.uid
    const { itemId } = req.params
    const { checked } = req.body ?? {}
    const itemRef = getItemRef(itemId)
    const snapshot = await itemRef.get()

    if(!snapshot.exists) {
        return res.status(404).json({ message: 'Item not found.' })
    }

    if(snapshot.data()?.userId !== uid) {
        return res.status(403).json({ message: 'Forbidden.' })
    }

    await itemRef.update({
        checked: Boolean(checked),
        updatedAt: new Date(),
    })

    const updated = await itemRef.get()
    return res.json({ item: serializeDoc(updated) })

})

itemsRouter.delete('/items/:itemId', async (req, res) => {

    const uid = req.user.uid
    const { itemId } = req.params
    const itemRef = getItemRef(itemId)
    const snapshot = await itemRef.get()

    if(!snapshot.exists) {
        return res.status(404).json({ message: 'Item not found.' })
    }

    if(snapshot.data()?.userId !== uid) {
        return res.status(403).json({ message: 'Forbidden.' })
    }

    await itemRef.delete()
    return res.status(204).send()

})

itemsRouter.delete('/trips/:tripId/items', async (req, res) => {

    const uid = req.user.uid
    const { tripId } = req.params

    const { snapshot: tripSnapshot } = await getTripById(tripId)

    if(!tripSnapshot.exists) {
        return res.status(404).json({ message: 'Trip not found.' })
    }

    if(tripSnapshot.data()?.userId !== uid) {
        return res.status(403).json({ message: 'Forbidden.' })
    }

    const snapshot = await db
        .collection('items')
        .where('userId', '==', uid)
        .where('tripId', '==', tripId)
        .get()

    await Promise.all(snapshot.docs.map((itemDoc) => itemDoc.ref.delete()))
    return res.status(204).send()

})

export default itemsRouter
