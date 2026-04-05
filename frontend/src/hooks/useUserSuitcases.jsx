import { useEffect, useState } from 'react'
import { subscribeToSuitcases } from '../services/suitcaseService'

const useUserSuitcases = (uid) => {
    const [suitcases, setSuitcases] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if(!uid) {
            setSuitcases([])
            setLoading(false)
            setError(null)
            return undefined
        }

        setLoading(true)
        setError(null)

        const unsubscribe = subscribeToSuitcases(
            uid,
            (nextSuitcases) => {
                setSuitcases(nextSuitcases)
                setLoading(false)
            },
            (nextError) => {
                console.error('Failed to load suitcases', nextError)
                setError(nextError)
                setLoading(false)
            },
        )

        return () => unsubscribe()
    }, [uid])

    return { suitcases, loading, error }
}

export default useUserSuitcases
