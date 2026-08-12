import { SignJWT, importPKCS8 } from 'jose'

const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const tokenCache = new Map()

const getServiceAccount = (env) => {
    const clientEmail = String(env.FIREBASE_CLIENT_EMAIL ?? '').trim()
    const privateKey = String(env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n').trim()

    if (!clientEmail || !privateKey) {
        throw new Error('Firebase Admin credentials are not configured.')
    }

    return { clientEmail, privateKey }
}

const getAdminAccessToken = async (env) => {
    const { clientEmail, privateKey } = getServiceAccount(env)
    const cached = tokenCache.get(clientEmail)

    if (cached?.expiresAt > Date.now() + 60_000) {
        return cached.accessToken
    }

    const now = Math.floor(Date.now() / 1000)
    const signingKey = await importPKCS8(privateKey, 'RS256')
    const assertion = await new SignJWT({ scope: FIRESTORE_SCOPE })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuer(clientEmail)
        .setAudience(GOOGLE_TOKEN_URL)
        .setIssuedAt(now)
        .setExpirationTime(now + 3600)
        .sign(signingKey)
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
        }),
    })

    if (!response.ok) {
        throw new Error('Firebase Admin authentication failed.')
    }

    const data = await response.json()
    const expiresIn = Number(data.expires_in) || 3600
    tokenCache.set(clientEmail, {
        accessToken: data.access_token,
        expiresAt: Date.now() + (expiresIn * 1000),
    })
    return data.access_token
}

const getDocumentsBaseUrl = (env) => (
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)/documents`
)

const firestoreRequest = async (env, path, options = {}) => {
    const accessToken = await getAdminAccessToken(env)
    const response = await fetch(`${getDocumentsBaseUrl(env)}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers ?? {}),
        },
    })

    if (!response.ok) {
        const error = new Error(`Firestore Admin request failed with status ${response.status}.`)
        error.status = response.status
        throw error
    }

    return response.status === 204 ? null : response.json()
}

const encodeValue = (value) => {
    if (value === null || value === undefined) return { nullValue: null }
    if (typeof value === 'string') return { stringValue: value }
    if (typeof value === 'boolean') return { booleanValue: value }
    if (typeof value === 'number') {
        return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
    }
    if (value instanceof Date) return { timestampValue: value.toISOString() }
    if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } }
    return {
        mapValue: {
            fields: Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, encodeValue(nestedValue)])),
        },
    }
}

const decodeValue = (value = {}) => {
    if ('nullValue' in value) return null
    if ('stringValue' in value) return value.stringValue
    if ('booleanValue' in value) return value.booleanValue
    if ('integerValue' in value) return Number(value.integerValue)
    if ('doubleValue' in value) return Number(value.doubleValue)
    if ('timestampValue' in value) return value.timestampValue
    if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decodeValue)
    if ('mapValue' in value) return decodeFields(value.mapValue.fields ?? {})
    return null
}

const encodeFields = (data) => Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, encodeValue(value)]),
)

const decodeFields = (fields = {}) => Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]),
)

const documentIdFromName = (name) => String(name ?? '').split('/').pop()

const getAdminDocument = async (env, collectionName, documentId) => {
    try {
        const document = await firestoreRequest(
            env,
            `/${encodeURIComponent(collectionName)}/${encodeURIComponent(documentId)}`,
        )
        return { id: documentIdFromName(document.name), _updateTime: document.updateTime, ...decodeFields(document.fields) }
    } catch (error) {
        if (error.status === 404) return null
        throw error
    }
}

const buildFieldFilter = (fieldPath, value) => ({
    fieldFilter: {
        field: { fieldPath },
        op: 'EQUAL',
        value: encodeValue(value),
    },
})

const queryAdminDocuments = async (env, collectionName, filters, limit = 100, orderBy = []) => {
    const where = filters.length === 0
        ? null
        : filters.length === 1
            ? buildFieldFilter(filters[0][0], filters[0][1])
            : {
            compositeFilter: {
                op: 'AND',
                filters: filters.map(([fieldPath, value]) => buildFieldFilter(fieldPath, value)),
            },
        }
    const results = await firestoreRequest(env, ':runQuery', {
        method: 'POST',
        body: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: collectionName }],
                ...(where ? { where } : {}),
                ...(orderBy.length ? {
                    orderBy: orderBy.map(({ fieldPath, direction = 'ASCENDING' }) => ({
                        field: { fieldPath },
                        direction,
                    })),
                } : {}),
                limit,
            },
        }),
    })

    return results
        .filter((result) => result.document)
        .map(({ document }) => ({
            id: documentIdFromName(document.name),
            ...decodeFields(document.fields),
        }))
}

const createAdminDocument = async (env, collectionName, documentId, data) => {
    await firestoreRequest(
        env,
        `/${encodeURIComponent(collectionName)}?documentId=${encodeURIComponent(documentId)}`,
        { method: 'POST', body: JSON.stringify({ fields: encodeFields(data) }) },
    )
    return documentId
}

const updateAdminDocument = async (env, collectionName, documentId, data, options = {}) => {
    const updateMask = Object.keys(data)
        .map((fieldPath) => `updateMask.fieldPaths=${encodeURIComponent(fieldPath)}`)
        .join('&')
    const precondition = options.updateTime
        ? `&currentDocument.updateTime=${encodeURIComponent(options.updateTime)}`
        : ''
    await firestoreRequest(
        env,
        `/${encodeURIComponent(collectionName)}/${encodeURIComponent(documentId)}?${updateMask}${precondition}`,
        { method: 'PATCH', body: JSON.stringify({ fields: encodeFields(data) }) },
    )
}

const deleteAdminAuthUser = async (env, uid) => {
    const accessToken = await getAdminAccessToken(env)
    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:delete', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ localId: uid, targetProjectId: env.FIREBASE_PROJECT_ID }),
    })

    if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const reason = body?.error?.message ?? ''
        if (response.status === 404 || reason === 'USER_NOT_FOUND') return
        const error = new Error(`Firebase Auth deletion failed with status ${response.status}.`)
        error.status = response.status
        throw error
    }
}

const deleteAdminDocument = async (env, collectionName, documentId) => {
    await firestoreRequest(
        env,
        `/${encodeURIComponent(collectionName)}/${encodeURIComponent(documentId)}`,
        { method: 'DELETE' },
    )
}

export {
    createAdminDocument,
    deleteAdminAuthUser,
    deleteAdminDocument,
    getAdminDocument,
    queryAdminDocuments,
    updateAdminDocument,
}
