import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { getDoc, doc } from 'firebase/firestore'

const AuthContext = createContext()

const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [authError, setAuthError] = useState(null)

    const loadProfile = useCallback(async (uid) => {

        const profileRef = doc(db, 'users', uid)
        const profileSnap = await getDoc(profileRef)

        if (profileSnap.exists()) {
            setProfile(profileSnap.data())
        } else {
            setProfile(null)
        }

    }, [])

    useEffect(() => {

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                setAuthError(null)
                setUser(firebaseUser)

                if (firebaseUser) {
                    await loadProfile(firebaseUser.uid)
                } else {
                    setProfile(null)
                }
            } catch (error) {
                console.error('Failed to sync auth/profile state', error)
                setAuthError(error)
                setProfile(null)
            } finally {
                setLoading(false)
            }
        })

        return () => unsubscribe()

    }, [loadProfile])

    const logout = async () => {
        await signOut(auth)
    }

    const refreshProfile = useCallback(() => {
        return user ? loadProfile(user.uid) : Promise.resolve()
    }, [user, loadProfile])

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                authError,
                logout,
                refreshProfile,
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    )
    
}

const useAuth = () => useContext(AuthContext)

export {
    AuthProvider,
    useAuth
}