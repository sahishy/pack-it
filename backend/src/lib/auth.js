import { createRemoteJWKSet, jwtVerify } from 'jose'

const FIREBASE_JWKS_URL = new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
)
const firebaseJwks = createRemoteJWKSet(FIREBASE_JWKS_URL)
const APP_CHECK_JWKS_URL = new URL('https://firebaseappcheck.googleapis.com/v1/jwks')
const appCheckJwks = createRemoteJWKSet(APP_CHECK_JWKS_URL)

const getBearerToken = (request) => {
    const authorization = request.headers.get('Authorization') ?? ''
    const [scheme, token] = authorization.split(' ')

    return scheme === 'Bearer' && token ? token : null
}

const verifyFirebaseTokenString = async (token, env) => {
    if (!token) throw new Error('Missing bearer token.')
    const projectId = env.FIREBASE_PROJECT_ID
    const { payload } = await jwtVerify(token, firebaseJwks, {
        algorithms: ['RS256'],
        audience: projectId,
        issuer: `https://securetoken.google.com/${projectId}`,
        clockTolerance: 5,
    })

    if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.length > 128) {
        throw new Error('Token is missing a subject.')
    }

    const now = Math.floor(Date.now() / 1000)

    if (typeof payload.iat !== 'number' || payload.iat > now + 5) {
        throw new Error('Token has an invalid issued-at time.')
    }

    if (typeof payload.auth_time !== 'number' || payload.auth_time > now + 5) {
        throw new Error('Token has an invalid authentication time.')
    }

    return {
        uid: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : '',
        isAnonymous: payload.firebase?.sign_in_provider === 'anonymous',
    }
}

const verifyFirebaseIdToken = (request, env) => verifyFirebaseTokenString(getBearerToken(request), env)

const verifyFirebaseAppCheckToken = async (request, env) => {
    const enforceAppCheck = String(env.ENFORCE_APP_CHECK ?? '').toLowerCase() === 'true'
    const token = request.headers.get('X-Firebase-AppCheck') ?? ''

    if (!token) {
        if (enforceAppCheck) throw new Error('Missing App Check token.')
        return null
    }

    const projectNumber = String(env.FIREBASE_PROJECT_NUMBER ?? '').trim()
    if (!projectNumber) {
        if (enforceAppCheck) throw new Error('Firebase project number is not configured.')
        return null
    }

    try {
        const { payload } = await jwtVerify(token, appCheckJwks, {
            algorithms: ['RS256'],
            issuer: `https://firebaseappcheck.googleapis.com/${projectNumber}`,
        })
        const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
        if (!audiences.includes(`projects/${projectNumber}`)) {
            throw new Error('App Check token has an invalid audience.')
        }

        const allowedAppIds = String(env.FIREBASE_APP_IDS ?? '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        if (allowedAppIds.length && !allowedAppIds.includes(payload.sub)) {
            throw new Error('App Check token is for an unknown app.')
        }

        return { appId: payload.sub }
    } catch (error) {
        if (enforceAppCheck) throw error
        console.warn('Ignoring invalid App Check token while enforcement is disabled.', error)
        return null
    }
}

export { verifyFirebaseAppCheckToken, verifyFirebaseIdToken, verifyFirebaseTokenString }
