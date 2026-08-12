import { doc, onSnapshot, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const DEFAULT_PREFERENCES = { theme: 'light', measurementSystem: 'metric' }

const normalizePreferences = (preferences = {}) => ({
    ...DEFAULT_PREFERENCES,
    ...(preferences ?? {}),
})

const createNewUserObject = ({ uid, firstName, lastName, email, profilePictureUrl = '', preferences = DEFAULT_PREFERENCES }) => ({
    uid,
    firstName,
    lastName,
    email,
    profilePictureUrl,
    preferences: normalizePreferences(preferences),
})

const createGuestUserObject = (uid) => ({
    uid,
    firstName: 'Guest',
    lastName: '',
    email: '',
    profilePictureUrl: '',
    preferences: DEFAULT_PREFERENCES,
})

const createUserProfile = async (uid, userData, options = {}) => {
    const userRef = doc(db, 'users', uid)

    await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(userRef)
        const payload = {
            ...userData,
            uid,
            preferences: normalizePreferences(userData.preferences),
            updatedAt: serverTimestamp(),
        }

        if (!snapshot.exists()) {
            payload.createdAt = serverTimestamp()
        }

        transaction.set(userRef, payload, { merge: Boolean(options.merge) })
    })
}

const updateUserInfo = async (uid, userData) => {
    await setDoc(doc(db, 'users', uid), {
        ...userData,
        uid,
        updatedAt: serverTimestamp(),
    }, { merge: true })
}

const updateUserPreferences = async (uid, preferences) => {
    await setDoc(doc(db, 'users', uid), {
        uid,
        preferences: normalizePreferences(preferences),
        updatedAt: serverTimestamp(),
    }, { merge: true })
}

const subscribeToUserProfile = (uid, onNext, onError) => {
    if (!uid) {
        onNext(null)
        return () => {}
    }

    return onSnapshot(doc(db, 'users', uid), (snapshot) => {
        if (!snapshot.exists()) {
            onNext(null)
            return
        }

        const profile = snapshot.data()
        onNext({ ...profile, preferences: normalizePreferences(profile.preferences) })
    }, onError)
}

export {
    createNewUserObject,
    createGuestUserObject,
    createUserProfile,
    subscribeToUserProfile,
    updateUserInfo,
    updateUserPreferences,
}
