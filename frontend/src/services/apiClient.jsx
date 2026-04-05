import { auth } from '../lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const createErrorFromResponse = async (response) => {
    let message = `Request failed with status ${response.status}`

    try {
        const data = await response.json()
        message = data?.message || message
    } catch {
        // fallback message
    }

    return new Error(message)
}

const request = async (path, options = {}) => {
    const user = auth.currentUser

    if (!user) {
        throw new Error('You must be logged in to perform this action.')
    }

    const token = await user.getIdToken()

    const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers ?? {}),
        },
    })

    if (!response.ok) {
        throw await createErrorFromResponse(response)
    }

    if (response.status === 204) {
        return null
    }

    return response.json()
}

const apiGet = (path) => request(path)

const apiPost = (path, body) => request(path, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
})

const apiPut = (path, body) => request(path, {
    method: 'PUT',
    body: JSON.stringify(body ?? {}),
})

const apiPatch = (path, body) => request(path, {
    method: 'PATCH',
    body: JSON.stringify(body ?? {}),
})

const apiDelete = (path, body) => request(path, {
    method: 'DELETE',
    body: body === undefined ? undefined : JSON.stringify(body),
})

const apiPostFormData = (path, formData) => request(path, {
    method: 'POST',
    body: formData,
})

export {
    apiGet,
    apiPost,
    apiPut,
    apiPatch,
    apiDelete,
    apiPostFormData,
}
