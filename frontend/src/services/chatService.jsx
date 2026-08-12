import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { workerPost } from './workerClient'

const sendChatMessage = async ({ tripId, messageId, message }) => workerPost('/v1/ai/chat', {
    tripId,
    messageId,
    message,
})

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
