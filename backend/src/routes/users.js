import { Router } from 'express'
import { db } from '../lib/firebaseAdmin.js'
import { serializeDoc } from '../utils/firestoreUtils.js'

const usersRouter = Router()

const DEFAULT_PREFERENCES = {
    theme: '',
    measurementSystem: '',
}

const normalizePreferences = (preferences = {}) => ({
    ...DEFAULT_PREFERENCES,
    ...(preferences ?? {}),
})

usersRouter.get('/me', async (req, res) => {

    const uid = req.user.uid
    const userRef = db.collection('users').doc(uid)
    const snapshot = await userRef.get()

    if(!snapshot.exists) {
        return res.json({ profile: null })
    }

    const profile = serializeDoc(snapshot)

    return res.json({
        profile: {
            ...profile,
            preferences: normalizePreferences(profile?.preferences),
        },
    })

})

usersRouter.put('/me', async (req, res) => {

    const uid = req.user.uid
    const userRef = db.collection('users').doc(uid)
    const { userData = {}, options = {} } = req.body ?? {}
    const hasPreferences = Object.prototype.hasOwnProperty.call(userData, 'preferences')
    const payload = {
        ...userData,
        uid,
        updatedAt: new Date(),
    }

    if (hasPreferences) {
        payload.preferences = normalizePreferences(userData?.preferences)
    } else if (!options.merge) {
        payload.preferences = normalizePreferences()
    }

    if(!options.merge) {
        payload.createdAt = userData?.createdAt ? new Date(userData.createdAt) : new Date()
    }

    await userRef.set(payload, { merge: Boolean(options.merge) })
    const snapshot = await userRef.get()
    const profile = serializeDoc(snapshot)

    return res.json({
        profile: {
            ...profile,
            preferences: normalizePreferences(profile?.preferences),
        },
    })

})

export default usersRouter
