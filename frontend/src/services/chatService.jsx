import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { workerPost, workerPostFormData } from './workerClient'

const sendChatMessage = async ({ tripId, messageId, message, image }) => {
    if (!image) {
        return workerPost('/v1/ai/chat', { tripId, messageId, message })
    }

    const formData = new FormData()
    formData.append('tripId', tripId)
    formData.append('messageId', messageId)
    formData.append('message', message)
    formData.append('image', image, image.name || 'chat-photo.jpg')
    return workerPostFormData('/v1/ai/chat', formData)
}

const subscribeToTripChatMessages = (uid, tripId, onNext, onError) => {
    if (!uid || !tripId) {
        onNext([])
        return () => {}
    }

    const messagesQuery = query(
        collection(db, 'chatMessages'),
        where('userId', '==', uid),
        where('tripId', '==', tripId),
        orderBy('createdAt', 'asc'),
    )

    return onSnapshot(messagesQuery, (snapshot) => {
        onNext(snapshot.docs.map((messageDoc) => ({
            id: messageDoc.id,
            actions: [],
            ...messageDoc.data(),
        })))
    }, onError)
}

export { sendChatMessage, subscribeToTripChatMessages }
