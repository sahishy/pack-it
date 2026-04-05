import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const config = {
    port: Number(process.env.PORT),
    frontendOrigin: process.env.FRONTEND_ORIGIN,
    pexelsApiKey: process.env.PEXELS_API_KEY,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
}

export default config
