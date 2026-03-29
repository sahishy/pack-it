import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import useUserProfile from '../hooks/useUserProfile'

const AuthContext = createContext()

const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [authError, setAuthError] = useState(null)

    const {
        profile,
        loading: profileLoading,
        error: profileError,
    } = useUserProfile(user?.uid)

    useEffect(() => {

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                setAuthError(null)
                setUser(firebaseUser)
            } catch (error) {
                console.error('Failed to sync auth/profile state', error)
                setAuthError(error)
            } finally {
                setAuthLoading(false)
            }
        })

        return () => unsubscribe()

    }, [])

    const logout = async () => {
        await signOut(auth)
    }

    const loading = authLoading || (user ? profileLoading : false)

    const refreshProfile = useCallback(() => Promise.resolve(), [])

    const mergedAuthError = useMemo(() => authError ?? profileError ?? null, [authError, profileError])

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                error: mergedAuthError,
                authError: mergedAuthError,
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