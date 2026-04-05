import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { apiDelete, apiPatch, apiPost, apiPostFormData } from './apiClient'

const createSuitcase = async (_uid, suitcaseData, confidence = {}) => {
    const data = await apiPost('/api/suitcases', { suitcaseData, confidence })
    return data?.suitcase?.id
}

const updateSuitcase = async (suitcaseId, suitcaseData) => {
    await apiPatch(`/api/suitcases/${suitcaseId}`, { suitcaseData })
}

const deleteSuitcase = async (suitcaseId) => {
    await apiDelete(`/api/suitcases/${suitcaseId}`)
}

const analyzeSuitcaseImage = async ({ file }) => {
    if(!file) {
        throw new Error('Suitcase image is required.')
    }

    const formData = new FormData()
    formData.append('image', file)

    const data = await apiPostFormData('/api/suitcases/vision', formData)

    return data?.prediction ?? null
}

const subscribeToSuitcases = (uid, onNext, onError) => {
    if(!uid) {
        onNext([])
        return () => {}
    }

    const suitcasesQuery = query(
        collection(db, 'suitcases'),
        where('userId', '==', uid),
    )

    return onSnapshot(
        suitcasesQuery,
        (snapshot) => {
            const suitcases = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))

            onNext(suitcases)
        },
        (error) => onError?.(error),
    )
}

export {
    createSuitcase,
    updateSuitcase,
    deleteSuitcase,
    analyzeSuitcaseImage,
    subscribeToSuitcases,
}
