import { useEffect, useState } from 'react'
import { subscribeToUserProfile } from '../services/userService'

const useUserProfile = (uid) => {

    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {

        if (!uid) {
            setProfile(null)
            setLoading(false)
            setError(null)
            return undefined
        }

        setLoading(true)
        setError(null)

        const unsubscribe = subscribeToUserProfile(
            uid,
            (nextProfile) => {
                setProfile(nextProfile)
                setLoading(false)
            },
            (nextError) => {
                console.error('Failed to load profile', nextError)
                setError(nextError)
                setLoading(false)
            },
        )

        return () => unsubscribe()

    }, [uid])

    return {
        profile,
        loading,
        error,
    }

}

export default useUserProfile