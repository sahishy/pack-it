import { Router } from 'express'
import { db } from '../lib/firebaseAdmin.js'
import { serializeDoc } from '../utils/firestoreUtils.js'
import { getPredictedItemWeight } from '../utils/aiUtils.js'

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
        checked: false,
        createdAt: new Date(),
    }

    const docRef = await db.collection('items').add(payload)
    const snapshot = await docRef.get()

    return res.status(201).json({ item: serializeDoc(snapshot) })

})

itemsRouter.patch('/items/:itemId/weight', async (req, res) => {

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

    const weightPrediction = await getPredictedItemWeight({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
    })

    await itemRef.update({
        weight: weightPrediction,
        updatedAt: new Date(),
    })

    const updated = await itemRef.get()
    return res.json({
        weight: weightPrediction,
        item: serializeDoc(updated),
    })

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
