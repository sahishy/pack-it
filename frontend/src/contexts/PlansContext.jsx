import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import useTripPlan from '../hooks/useTripPlan'
import { generatePlanResult, generatePlanStrategy } from '../services/planService'
import { useSuitcases } from './SuitcasesContext'

const PlansContext = createContext()

const PlansProvider = ({ children }) => {
    const { user } = useAuth()
    const { suitcases } = useSuitcases()
    const [generatingResult, setGeneratingResult] = useState(false)
    const [generateResultError, setGenerateResultError] = useState(null)
    const [generatingStrategy, setGeneratingStrategy] = useState(false)
    const [generateStrategyError, setGenerateStrategyError] = useState(null)

    const generateResult = useCallback(async (trip, items) => {
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
    }, [user?.uid])

    const generateStrategy = useCallback(async (tripId, items) => {
        if (!user?.uid) {
            throw new Error('You must be logged in to generate a strategy.')
        }

        try {
            setGeneratingStrategy(true)
            setGenerateStrategyError(null)
            return await generatePlanStrategy(user.uid, tripId, items, suitcases)
        } catch (errorValue) {
            setGenerateStrategyError(errorValue)
            throw errorValue
        } finally {
            setGeneratingStrategy(false)
        }
    }, [suitcases, user?.uid])

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
        generateResult,
        generateStrategy,
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
