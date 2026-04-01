import { admin } from '../lib/firebaseAdmin.js'

const requireAuth = async (req, res, next) => {

    const authorization = req.headers.authorization || ''
    const [scheme, token] = authorization.split(' ')

    if(scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Unauthorized. Missing bearer token.' })
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token)
        req.user = {
            uid: decoded.uid,
            email: decoded.email || '',
        }
        return next()
    } catch (error) {
        console.error('[auth] verifyIdToken failed', {
            code: error?.code || 'unknown',
            message: error?.message || 'Unknown auth verification error',
        })
        return res.status(401).json({ message: 'Unauthorized. Invalid token.' })
    }

}

export {
    requireAuth
}
