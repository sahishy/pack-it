import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToTripPlan } from '../services/planService'

const useTripPlan = (tripId) => {
    const { user } = useAuth()

    const [plan, setPlan] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!user?.uid || !tripId) {
            setPlan(null)
            setLoading(false)
            setError(null)
            return undefined
        }

        setLoading(true)
        setError(null)

        const unsubscribe = subscribeToTripPlan(
            user.uid,
            tripId,
            (nextPlan) => {
                setPlan(nextPlan)
                setLoading(false)
            },
            (nextError) => {
                console.error('Failed to load plan', nextError)
                setError(nextError)
                setLoading(false)
            },
        )

        return () => unsubscribe()
    }, [user?.uid, tripId])

    return {
        plan,
        loading,
        error,
    }
}

export default useTripPlan