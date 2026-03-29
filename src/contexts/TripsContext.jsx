import { createContext, useContext, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { createTrip } from '../services/tripService'
import useUserTrips from '../hooks/useUserTrips'

const TripsContext = createContext()

const TripsProvider = ({ children }) => {

    const { user } = useAuth()
    const { trips, loading, error } = useUserTrips(user?.uid)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState(null)

    const addTrip = async (tripData) => {
        if (!user?.uid) {
            throw new Error('You must be logged in to create a trip.')
        }

        try {
            setCreating(true)
            setCreateError(null)
            return await createTrip(user.uid, tripData)
        } catch (errorValue) {
            setCreateError(errorValue)
            throw errorValue
        } finally {
            setCreating(false)
        }
    }

    const contextValue = useMemo(() => ({
        trips,
        loading,
        error,
        creating,
        createError,
        addTrip,
    }), [trips, loading, error, creating, createError])

    return (
        <TripsContext.Provider value={contextValue}>
            {children}
        </TripsContext.Provider>
    )

}

const useTrips = () => useContext(TripsContext)

export {
    TripsProvider,
    useTrips,
}
