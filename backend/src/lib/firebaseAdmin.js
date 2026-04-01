import admin from 'firebase-admin'
import config from '../config.js'

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: config.firebaseProjectId,
        clientEmail: config.firebaseClientEmail,
        privateKey: config.firebasePrivateKey.replace(/\\n/g, '\n'),
    }),
});

const db = admin.firestore()

export {
    admin,
    db,
}
