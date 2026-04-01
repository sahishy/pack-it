import { createContext, useContext, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { createTrip, deleteTrip, updateTrip } from '../services/tripService'
import useUserTrips from '../hooks/useUserTrips'

const TripsContext = createContext()

const TripsProvider = ({ children }) => {

    const { user } = useAuth()
    const { trips, loading, error } = useUserTrips(user?.uid)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState(null)
    const [updating, setUpdating] = useState(false)
    const [updateError, setUpdateError] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState(null)

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

    const editTrip = async (tripId, tripData) => {
        if (!user?.uid) {
            throw new Error('You must be logged in to edit a trip.')
        }

        try {
            setUpdating(true)
            setUpdateError(null)
            await updateTrip(tripId, tripData)
        } catch (errorValue) {
            setUpdateError(errorValue)
            throw errorValue
        } finally {
            setUpdating(false)
        }
    }

    const removeTrip = async (tripId) => {
        if (!user?.uid) {
            throw new Error('You must be logged in to delete a trip.')
        }

        try {
            setDeleting(true)
            setDeleteError(null)
            await deleteTrip(tripId)
        } catch (errorValue) {
            setDeleteError(errorValue)
            throw errorValue
        } finally {
            setDeleting(false)
        }
    }

    const contextValue = useMemo(() => ({
        trips,
        loading,
        error,
        creating,
        createError,
        updating,
        updateError,
        deleting,
        deleteError,
        addTrip,
        editTrip,
        removeTrip,
    }), [
        trips,
        loading,
        error,
        creating,
        createError,
        updating,
        updateError,
        deleting,
        deleteError,
    ])

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
