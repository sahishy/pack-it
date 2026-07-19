import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, initializeAuth, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { Capacitor } from '@capacitor/core'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

const db = getFirestore(app)
let auth = null
let googleProvider = null

if (Capacitor.isNativePlatform()) {
    auth = initializeAuth(app, {
        persistence: browserLocalPersistence,
    })
} else {
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
}

export { db, auth, googleProvider }