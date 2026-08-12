import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { commitInChunks } from './firestoreBatchService'
import { requestGuestUpgrade, workerPostFormData } from './workerClient'

const toPositiveNumber = (value) => {
    const number = Number(value)
    return Number.isFinite(number) && number > 0 ? Number(number.toFixed(2)) : null
}

const normalizeSuitcase = (suitcaseData = {}) => ({
    name: String(suitcaseData.name ?? '').trim(),
    dimensions: {
        lengthCm: toPositiveNumber(suitcaseData?.dimensions?.lengthCm),
        widthCm: toPositiveNumber(suitcaseData?.dimensions?.widthCm),
        heightCm: toPositiveNumber(suitcaseData?.dimensions?.heightCm),
    },
})

const assertValidSuitcase = (suitcase) => {
    if (!suitcase.name || Object.values(suitcase.dimensions).some((value) => value === null)) {
        throw new Error('Name and all dimensions are required.')
    }
}

const createSuitcase = async (uid, suitcaseData, confidence = {}) => {
    const suitcase = normalizeSuitcase(suitcaseData)
    assertValidSuitcase(suitcase)

    const suitcaseRef = await addDoc(collection(db, 'suitcases'), {
        userId: uid,
        ...suitcase,
        confidenceName: Number.isFinite(Number(confidence.confidenceName))
            ? Number(Number(confidence.confidenceName).toFixed(2))
            : 1,
        confidenceDimensions: Number.isFinite(Number(confidence.confidenceDimensions))
            ? Number(Number(confidence.confidenceDimensions).toFixed(2))
            : 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })

    return suitcaseRef.id
}

const updateSuitcase = async (suitcaseId, suitcaseData) => {
    const suitcase = normalizeSuitcase(suitcaseData)
    assertValidSuitcase(suitcase)

    await updateDoc(doc(db, 'suitcases', suitcaseId), {
        ...suitcase,
        updatedAt: serverTimestamp(),
    })
}

const deleteSuitcase = async (uid, suitcaseId) => {
    const itemsSnapshot = await getDocs(query(
        collection(db, 'items'),
        where('userId', '==', uid),
        where('suitcaseId', '==', suitcaseId),
    ))

    await commitInChunks(itemsSnapshot.docs, (batch, itemDoc) => {
        batch.update(itemDoc.ref, { suitcaseId: '', updatedAt: serverTimestamp() })
    })
    await deleteDoc(doc(db, 'suitcases', suitcaseId))
}

const analyzeSuitcaseImage = async ({ file }) => {
    if (!file) throw new Error('Suitcase image is required.')
    if (auth.currentUser?.isAnonymous) {
        const error = new Error('Create an account to use suitcase photo analysis.')
        error.code = 'guest_upgrade_required'
        error.feature = 'suitcase_scan'
        requestGuestUpgrade(error.feature)
        throw error
    }

    const formData = new FormData()
    formData.append('image', file)
    const data = await workerPostFormData('/v1/ai/suitcase-vision', formData)
    return data?.prediction ?? null
}

const subscribeToSuitcases = (uid, onNext, onError) => {
    if (!uid) {
        onNext([])
        return () => {}
    }

    const suitcasesQuery = query(collection(db, 'suitcases'), where('userId', '==', uid))
    return onSnapshot(suitcasesQuery, (snapshot) => {
        onNext(snapshot.docs.map((suitcaseDoc) => ({ id: suitcaseDoc.id, ...suitcaseDoc.data() })))
    }, onError)
}

export {
    analyzeSuitcaseImage,
    createSuitcase,
    deleteSuitcase,
    subscribeToSuitcases,
    updateSuitcase,
}
