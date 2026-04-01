import { apiGet, apiPut } from './apiClient'

const POLL_INTERVAL_MS = 4000

const createNewUserObject = ({ uid, firstName, lastName, email, profilePictureUrl = '' }) => {

    return {
        uid: uid,
        firstName: firstName,
        lastName: lastName,
        email: email,
        profilePictureUrl: profilePictureUrl,
        preferences: {
            theme: 'light',
            measurementSystem: 'metric',
        },
        createdAt: new Date(),
    }

}

const createUserProfile = async (_uid, userData, options = {}) => {
    await apiPut('/api/users/me', {
        userData,
        options,
    })
}

const updateUserInfo = async (_uid, userData) => {
    await apiPut('/api/users/me', {
        userData,
        options: {
            merge: true,
        },
    })
}

const updateUserPreferences = async (_uid, preferences) => {
    await apiPut('/api/users/me', {
        userData: {
            preferences,
        },
        options: {
            merge: true,
        },
    })
}

const subscribeToUserProfile = (_uid, onNext, onError) => {
    let active = true

    const syncProfile = async () => {
        try {
            const data = await apiGet('/api/users/me')
            if (active) {
                onNext(data?.profile ?? null)
            }
        } catch (error) {
            if (active) {
                onError?.(error)
            }
        }
    }

    void syncProfile()
    const intervalId = setInterval(syncProfile, POLL_INTERVAL_MS)

    return () => {
        active = false
        clearInterval(intervalId)
    }
}

export {
    createNewUserObject,
    createUserProfile,
    updateUserInfo,
    updateUserPreferences,
    subscribeToUserProfile,
}