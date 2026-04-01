const KG_TO_LB = 2.2046226218

const resolveMeasurementSystem = (measurementSystem) => {
    return measurementSystem === 'imperial' ? 'imperial' : 'metric'
}

const toNumber = (value) => {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : 0
}

const convertWeightFromKg = (weightKg, measurementSystem) => {
    const safeWeight = toNumber(weightKg)
    const resolvedSystem = resolveMeasurementSystem(measurementSystem)

    if (resolvedSystem === 'imperial') {
        return safeWeight * KG_TO_LB
    }

    return safeWeight
}

const convertWeightToKg = (weightValue, measurementSystem) => {
    const safeWeight = toNumber(weightValue)
    const resolvedSystem = resolveMeasurementSystem(measurementSystem)

    if (resolvedSystem === 'imperial') {
        return safeWeight / KG_TO_LB
    }

    return safeWeight
}

const getWeightUnitLabel = (measurementSystem) => {
    return resolveMeasurementSystem(measurementSystem) === 'imperial' ? 'lb' : 'kg'
}

const formatWeightValue = (weightKg, { measurementSystem = 'metric', decimals = 1 } = {}) => {
    const convertedWeight = convertWeightFromKg(weightKg, measurementSystem)
    const roundedValue = Number(convertedWeight.toFixed(decimals))
    return roundedValue.toString()
}

const formatWeight = (weightKg, { measurementSystem = 'metric', decimals = 1 } = {}) => {
    const weightValue = formatWeightValue(weightKg, { measurementSystem, decimals })
    const unitLabel = getWeightUnitLabel(measurementSystem)
    return `${weightValue} ${unitLabel}`
}

export {
    convertWeightFromKg,
    convertWeightToKg,
    getWeightUnitLabel,
    formatWeightValue,
    formatWeight,
}