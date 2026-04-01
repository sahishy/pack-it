import { useEffect, useState } from 'react'
import { subscribeToUserTrips } from '../services/tripService'

const useUserTrips = (uid) => {

    const [trips, setTrips] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {

        if (!uid) {
            setTrips([])
            setLoading(false)
            setError(null)
            return undefined
        }

        setLoading(true)
        setError(null)

        const unsubscribe = subscribeToUserTrips(
            uid,
            (nextTrips) => {
                setTrips(nextTrips)
                setLoading(false)
            },
            (nextError) => {
                console.error('Failed to load trips', nextError)
                setError(nextError)
                setLoading(false)
            },
        )

        return () => unsubscribe()

    }, [uid])

    return { trips, loading, error }

}

export default useUserTrips