import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
    formatWeight as formatWeightWithSystem,
    formatWeightValue as formatWeightValueWithSystem,
    formatDimensions as formatDimensionsWithSystem,
    getLengthUnitLabel,
    getWeightUnitLabel,
} from '../utils/measurementUtils'

const useWeightFormatter = () => {
    const { profile } = useAuth()
    const measurementSystem = profile?.preferences?.measurementSystem ?? 'metric'
    const weightUnitLabel = getWeightUnitLabel(measurementSystem)
    const lengthUnitLabel = getLengthUnitLabel(measurementSystem)

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

    const formatDimensions = useCallback((dimensions, options = {}) => {
        return formatDimensionsWithSystem(dimensions, {
            measurementSystem,
            ...options,
        })
    }, [measurementSystem])

    return {
        measurementSystem,
        weightUnitLabel,
        lengthUnitLabel,
        formatWeight,
        formatWeightValue,
        formatDimensions,
    }
}

export default useWeightFormatter