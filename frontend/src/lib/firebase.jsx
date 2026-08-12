import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, initializeAuth, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { Capacitor } from '@capacitor/core'
import { FirebaseAppCheck } from '@capacitor-firebase/app-check'

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
let appCheck = null
let nativeAppCheckReady = null

if (Capacitor.isNativePlatform()) {
    auth = initializeAuth(app, {
        persistence: browserLocalPersistence,
    })
    nativeAppCheckReady = FirebaseAppCheck.initialize({
        isTokenAutoRefreshEnabled: true,
    }).catch((error) => {
        console.warn('Native App Check could not be initialized.', error)
    })
} else {
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()

    const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY
    if (appCheckSiteKey) {
        appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
            isTokenAutoRefreshEnabled: true,
        })
    }
}

export { app, appCheck, db, auth, googleProvider, nativeAppCheckReady }
