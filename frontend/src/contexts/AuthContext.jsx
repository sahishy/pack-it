import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
    EmailAuthProvider,
    linkWithCredential,
    linkWithPopup,
    signInAnonymously,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import useUserProfile from '../hooks/useUserProfile'
import { createGuestUserObject, createNewUserObject, createUserProfile } from '../services/userService'
import { workerPost } from '../services/workerClient'

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

    const continueAsGuest = async () => {
        const credential = await signInAnonymously(auth)
        await createUserProfile(credential.user.uid, createGuestUserObject(credential.user.uid), { merge: true })
        return credential.user
    }

    const saveUpgradedProfile = async (upgradedUser, details = {}) => {
        await createUserProfile(upgradedUser.uid, createNewUserObject({
            uid: upgradedUser.uid,
            firstName: details.firstName?.trim() || upgradedUser.displayName?.split(/\s+/)[0] || 'Traveler',
            lastName: details.lastName?.trim() || upgradedUser.displayName?.split(/\s+/).slice(1).join(' '),
            email: upgradedUser.email ?? details.email ?? '',
            profilePictureUrl: upgradedUser.photoURL ?? '',
            preferences: profile?.preferences,
        }), { merge: true })
    }

    const upgradeGuest = async ({ provider = 'email', email, password, firstName, lastName } = {}) => {
        if (!auth.currentUser?.isAnonymous) throw new Error('No guest account is active.')
        const credential = provider === 'google'
            ? await linkWithPopup(auth.currentUser, googleProvider)
            : await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password))
        await saveUpgradedProfile(credential.user, { email, firstName, lastName })
        return credential.user
    }

    const deleteGuestAccount = async () => {
        if (!auth.currentUser?.isAnonymous) throw new Error('No guest account is active.')
        await workerPost('/v1/auth/delete-guest', {})
        await signOut(auth)
    }

    const deleteAccount = async (email) => {
        if (!auth.currentUser || auth.currentUser.isAnonymous) throw new Error('No registered account is active.')
        await workerPost('/v1/auth/delete-account', { email })
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
                isGuest: Boolean(user?.isAnonymous),
                continueAsGuest,
                upgradeGuest,
                deleteGuestAccount,
                deleteAccount,
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
