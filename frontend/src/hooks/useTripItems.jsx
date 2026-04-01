import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToTripItems } from '../services/itemService'

const useTripItems = (tripId) => {
    const { user } = useAuth()

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!user?.uid || !tripId) {
            setItems([])
            setLoading(false)
            setError(null)
            return undefined
        }

        setLoading(true)
        setError(null)

        const unsubscribe = subscribeToTripItems(
            user.uid,
            tripId,
            (nextItems) => {
                setItems(nextItems)
                setLoading(false)
            },
            (nextError) => {
                console.error('Failed to load items', nextError)
                setError(nextError)
                setLoading(false)
            },
        )

        return () => unsubscribe()
    }, [user?.uid, tripId])

    return { items, loading, error }
}

export default useTripItems