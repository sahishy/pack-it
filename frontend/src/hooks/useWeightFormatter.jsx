import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
    formatWeight as formatWeightWithSystem,
    formatWeightValue as formatWeightValueWithSystem,
    getWeightUnitLabel,
} from '../utils/measurementUtils'

const useWeightFormatter = () => {
    const { profile } = useAuth()
    const measurementSystem = profile?.preferences?.measurementSystem ?? 'metric'
    const weightUnitLabel = getWeightUnitLabel(measurementSystem)

    const formatWeight = useCallback((weightKg, options = {}) => {
        return formatWeightWithSystem(weightKg, {
            measurementSystem,
            ...options,
        })
    }, [measurementSystem])

    const formatWeightValue = useCallback((weightKg, options = {}) => {
        return formatWeightValueWithSystem(weightKg, {
            measurementSystem,
            ...options,
        })
    }, [measurementSystem])

    return {
        measurementSystem,
        weightUnitLabel,
        formatWeight,
        formatWeightValue,
    }
}

export default useWeightFormatter