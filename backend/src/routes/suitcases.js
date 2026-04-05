import { Router } from 'express'
import multer from 'multer'
import { db } from '../lib/firebaseAdmin.js'
import { serializeDoc } from '../utils/firestoreUtils.js'
import { getPredictedSuitcaseFromImage } from '../utils/aiUtils.js'
import {
    buildSuitcasePayload,
    normalizeSuitcaseInput,
    isValidSuitcasePayload,
} from '../services/suitcaseService.js'

const suitcasesRouter = Router()
const MAX_SUITCASE_IMAGE_BYTES = 20 * 1024 * 1024
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_SUITCASE_IMAGE_BYTES,
    },
})

const getSuitcaseRef = (suitcaseId) => db.collection('suitcases').doc(suitcaseId)

suitcasesRouter.get('/suitcases', async (req, res) => {
    const uid = req.user.uid

    const snapshot = await db
        .collection('suitcases')
        .where('userId', '==', uid)
        .get()

    const suitcases = snapshot.docs.map(serializeDoc)
    return res.json({ suitcases })
})

suitcasesRouter.post('/suitcases', async (req, res) => {
    const uid = req.user.uid
    const { suitcaseData = {}, confidence = {} } = req.body ?? {}

    const normalized = normalizeSuitcaseInput(suitcaseData)

    if(!isValidSuitcasePayload(normalized)) {
        return res.status(400).json({ message: 'Name and all dimensions are required.' })
    }

    const payload = buildSuitcasePayload(uid, normalized, confidence)
    const docRef = await db.collection('suitcases').add(payload)
    const snapshot = await docRef.get()

    return res.status(201).json({ suitcase: serializeDoc(snapshot) })
})

suitcasesRouter.patch('/suitcases/:suitcaseId', async (req, res) => {
    const uid = req.user.uid
    const { suitcaseId } = req.params
    const { suitcaseData = {} } = req.body ?? {}
    const suitcaseRef = getSuitcaseRef(suitcaseId)
    const snapshot = await suitcaseRef.get()

    if(!snapshot.exists) {
        return res.status(404).json({ message: 'Suitcase not found.' })
    }

    if(snapshot.data()?.userId !== uid) {
        return res.status(403).json({ message: 'Forbidden.' })
    }

    const normalized = normalizeSuitcaseInput(suitcaseData)

    if(!isValidSuitcasePayload(normalized)) {
        return res.status(400).json({ message: 'Name and all dimensions are required.' })
    }

    await suitcaseRef.update({
        name: normalized.name,
        dimensions: normalized.dimensions,
        updatedAt: new Date(),
    })

    const updated = await suitcaseRef.get()
    return res.json({ suitcase: serializeDoc(updated) })
})

suitcasesRouter.delete('/suitcases/:suitcaseId', async (req, res) => {
    const uid = req.user.uid
    const { suitcaseId } = req.params
    const suitcaseRef = getSuitcaseRef(suitcaseId)
    const snapshot = await suitcaseRef.get()

    if(!snapshot.exists) {
        return res.status(404).json({ message: 'Suitcase not found.' })
    }

    if(snapshot.data()?.userId !== uid) {
        return res.status(403).json({ message: 'Forbidden.' })
    }

    await suitcaseRef.delete()
    return res.status(204).send()
})

suitcasesRouter.post('/suitcases/vision', upload.single('image'), async (req, res) => {
    const uid = req.user.uid
    const imageFile = req.file

    if(!imageFile?.buffer) {
        return res.status(400).json({ message: 'Suitcase image is required.' })
    }

    const aiCallStartedAt = Date.now()
    console.info('[AI][route] suitcase-vision.start', {
        route: 'POST /suitcases/vision',
        uid,
        mimeType: imageFile.mimetype || 'image/jpeg',
        fileSizeBytes: imageFile.size,
    })

    const prediction = await getPredictedSuitcaseFromImage({
        imageBuffer: imageFile.buffer,
        mimeType: imageFile.mimetype || 'image/jpeg',
    })

    console.info('[AI][route] suitcase-vision.success', {
        route: 'POST /suitcases/vision',
        uid,
        mimeType: imageFile.mimetype || 'image/jpeg',
        fileSizeBytes: imageFile.size,
        elapsedMs: Date.now() - aiCallStartedAt,
    })

    return res.json({ prediction })
})

export default suitcasesRouter
