import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    onSnapshot,
    query,
    updateDoc,
    where,
} from 'firebase/firestore'
import { estimateItemWeight } from '../utils/itemUtils'

const createItem = async (uid, tripId, itemData) => {
    const db = getFirestore()
    const itemsRef = collection(db, 'items')

    const payload = {
        userId: uid,
        tripId,
        name: itemData.name,
        category: itemData.category,
        quantity: Number(itemData.quantity),
        weight: estimateItemWeight(itemData),
        checked: false,
        createdAt: new Date(),
    }

    const docRef = await addDoc(itemsRef, payload)
    return docRef.id
}

const subscribeToTripItems = (uid, tripId, onNext, onError) => {
    const db = getFirestore()
    const itemsRef = collection(db, 'items')
    const itemsQuery = query(itemsRef, where('userId', '==', uid), where('tripId', '==', tripId))

    return onSnapshot(
        itemsQuery,
        (snapshot) => {
            const items = snapshot.docs.map((itemDoc) => ({
                id: itemDoc.id,
                checked: false,
                ...itemDoc.data(),
            }))

            onNext(items)
        },
        onError,
    )
}

const updateItemChecked = async (itemId, checked) => {
    const db = getFirestore()
    const itemRef = doc(db, 'items', itemId)

    await updateDoc(itemRef, {
        checked,
    })
}

const removeItem = async (itemId) => {
    const db = getFirestore()
    const itemRef = doc(db, 'items', itemId)

    await deleteDoc(itemRef)
}

const removeTripItems = async (uid, tripId) => {
    if (!uid || !tripId) {
        return
    }

    const db = getFirestore()
    const itemsRef = collection(db, 'items')
    const itemsQuery = query(itemsRef, where('userId', '==', uid), where('tripId', '==', tripId))
    const snapshot = await getDocs(itemsQuery)

    await Promise.all(snapshot.docs.map((itemDoc) => deleteDoc(doc(db, 'items', itemDoc.id))))
}

export {
    createItem,
    subscribeToTripItems,
    updateItemChecked,
    removeItem,
    removeTripItems,
}
