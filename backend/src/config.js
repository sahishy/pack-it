import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const config = {
    port: Number(process.env.PORT),
    frontendOrigin: process.env.FRONTEND_ORIGIN,
    pexelsApiKey: process.env.PEXELS_API_KEY,
    firebaseProjectId: process.env.VITE_FIREBASE_PROJECT_ID,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
}

export default config
