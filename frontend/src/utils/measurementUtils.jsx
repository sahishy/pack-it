const KG_TO_LB = 2.2046226218
const CM_TO_IN = 0.3937007874

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

const convertLengthFromCm = (lengthCm, measurementSystem) => {
    const safeLength = toNumber(lengthCm)
    const resolvedSystem = resolveMeasurementSystem(measurementSystem)

    if (resolvedSystem === 'imperial') {
        return safeLength * CM_TO_IN
    }

    return safeLength
}

const convertLengthToCm = (lengthValue, measurementSystem) => {
    const safeLength = toNumber(lengthValue)
    const resolvedSystem = resolveMeasurementSystem(measurementSystem)

    if (resolvedSystem === 'imperial') {
        return safeLength / CM_TO_IN
    }

    return safeLength
}

const getLengthUnitLabel = (measurementSystem) => {
    return resolveMeasurementSystem(measurementSystem) === 'imperial' ? 'in' : 'cm'
}

const formatLengthValue = (lengthCm, { measurementSystem = 'metric', decimals = 1 } = {}) => {
    const convertedLength = convertLengthFromCm(lengthCm, measurementSystem)
    const roundedValue = Number(convertedLength.toFixed(decimals))
    return roundedValue.toString()
}

const formatLength = (lengthCm, { measurementSystem = 'metric', decimals = 1 } = {}) => {
    const lengthValue = formatLengthValue(lengthCm, { measurementSystem, decimals })
    const unitLabel = getLengthUnitLabel(measurementSystem)
    return `${lengthValue} ${unitLabel}`
}

const formatDimensions = (
    dimensions = {},
    { measurementSystem = 'metric', decimals = 1 } = {},
) => {
    const length = formatLengthValue(dimensions?.lengthCm, { measurementSystem, decimals })
    const width = formatLengthValue(dimensions?.widthCm, { measurementSystem, decimals })
    const height = formatLengthValue(dimensions?.heightCm, { measurementSystem, decimals })
    const unitLabel = getLengthUnitLabel(measurementSystem)

    return `${length} × ${width} × ${height} ${unitLabel}`
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
    convertLengthFromCm,
    convertLengthToCm,
    getLengthUnitLabel,
    formatWeightValue,
    formatWeight,
    formatLengthValue,
    formatLength,
    formatDimensions,
}