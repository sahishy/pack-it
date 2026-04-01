import { createContext, useContext, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import useTripPlan from '../hooks/useTripPlan'
import { generatePlanResult, generatePlanStrategy } from '../services/planService'

const PlansContext = createContext()

const PlansProvider = ({ children }) => {
    const { user } = useAuth()
    const [generatingResult, setGeneratingResult] = useState(false)
    const [generateResultError, setGenerateResultError] = useState(null)
    const [generatingStrategy, setGeneratingStrategy] = useState(false)
    const [generateStrategyError, setGenerateStrategyError] = useState(null)

    const generateResult = async (trip, items) => {
        if (!user?.uid) {
            throw new Error('You must be logged in to generate a plan.')
        }

        try {
            setGeneratingResult(true)
            setGenerateResultError(null)
            return await generatePlanResult(user.uid, trip, items)
        } catch (errorValue) {
            setGenerateResultError(errorValue)
            throw errorValue
        } finally {
            setGeneratingResult(false)
        }
    }

    const generateStrategy = async (tripId, items) => {
        if (!user?.uid) {
            throw new Error('You must be logged in to generate a strategy.')
        }

        try {
            setGeneratingStrategy(true)
            setGenerateStrategyError(null)
            return await generatePlanStrategy(user.uid, tripId, items)
        } catch (errorValue) {
            setGenerateStrategyError(errorValue)
            throw errorValue
        } finally {
            setGeneratingStrategy(false)
        }
    }

    const contextValue = useMemo(() => ({
        generatingResult,
        generateResultError,
        generatingStrategy,
        generateStrategyError,
        generateResult,
        generateStrategy,
    }), [
        generatingResult,
        generateResultError,
        generatingStrategy,
        generateStrategyError,
    ])

    return (
        <PlansContext.Provider value={contextValue}>
            {children}
        </PlansContext.Provider>
    )
}

const usePlans = () => useContext(PlansContext)

export {
    PlansProvider,
    usePlans,
    useTripPlan,
}