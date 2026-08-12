import { getToken as getAppCheckToken } from 'firebase/app-check'
import { Capacitor } from '@capacitor/core'
import { FirebaseAppCheck } from '@capacitor-firebase/app-check'
import { appCheck, auth, nativeAppCheckReady } from '../lib/firebase'

const WORKER_BASE_URL = import.meta.env.VITE_WORKER_BASE_URL || 'http://localhost:8787'
const requestGuestUpgrade = (feature) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('packit:guest-upgrade', { detail: { feature } }))
    }
}

const createErrorFromResponse = async (response) => {
    let message = `Request failed with status ${response.status}`
    let errorCode
    let errorFeature

    try {
        const data = await response.json()
        message = data?.message || message
        errorCode = data?.code
        errorFeature = data?.feature
    } catch {
        // Keep the status-based fallback message.
    }

    const error = new Error(message)
    error.status = response.status
    error.code = errorCode
    error.feature = errorFeature
    if (errorCode === 'guest_upgrade_required') requestGuestUpgrade(errorFeature)
    return error
}

const workerRequest = async (path, options = {}) => {
    const user = auth.currentUser

    if (!user) {
        throw new Error('You must be logged in to perform this action.')
    }

    const token = await user.getIdToken()
    let appCheckToken = ''
    if (Capacitor.isNativePlatform()) {
        try {
            await nativeAppCheckReady
            appCheckToken = (await FirebaseAppCheck.getToken({ forceRefresh: false })).token
        } catch {
            // App Check enforcement is enabled only after deployment metrics are healthy.
        }
    } else if (appCheck) {
        try {
            appCheckToken = (await getAppCheckToken(appCheck, false)).token
        } catch {
            // App Check enforcement is enabled only after deployment metrics are healthy.
        }
    }
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
    const response = await fetch(`${WORKER_BASE_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(appCheckToken ? { 'X-Firebase-AppCheck': appCheckToken } : {}),
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers ?? {}),
        },
    })

    if (!response.ok) {
        throw await createErrorFromResponse(response)
    }

    return response.status === 204 ? null : response.json()
}

const workerPost = (path, body) => workerRequest(path, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
})

const workerPostFormData = (path, formData) => workerRequest(path, {
    method: 'POST',
    body: formData,
})

export { requestGuestUpgrade, workerPost, workerPostFormData, workerRequest }
