import unitConversions from '../../data/unitConversions.json'

const getUnitOptionsByCategory = (category) => {
    const categoryConfig = unitConversions?.[category]
    const units = categoryConfig?.units ?? {}

    return Object.entries(units).map(([unitName, config]) => ({
        value: unitName,
        label: unitName.charAt(0).toUpperCase() + unitName.slice(1),
        alias: config?.alias ?? '',
        factor: config?.factor,
        scale: config?.scale,
        offset: config?.offset,
    }))
}

const getDefaultUnitsForCategory = (category) => {
    const options = getUnitOptionsByCategory(category)

    return {
        fromUnit: options[0]?.value ?? '',
        toUnit: options[1]?.value ?? options[0]?.value ?? '',
    }
}

const getUnitConfig = (category, unitName) => {
    return unitConversions?.[category]?.units?.[unitName] ?? null
}

const convertTemperature = (amount, fromConfig, toConfig) => {
    const fromScale = Number(fromConfig?.scale) || 1
    const fromOffset = Number(fromConfig?.offset) || 0
    const toScale = Number(toConfig?.scale) || 1
    const toOffset = Number(toConfig?.offset) || 0

    const baseCelsius = (amount + fromOffset) * fromScale
    return (baseCelsius / toScale) - toOffset
}

const convertByFactor = (amount, fromConfig, toConfig) => {
    const fromFactor = Number(fromConfig?.factor) || 1
    const toFactor = Number(toConfig?.factor) || 1

    const baseAmount = amount * fromFactor
    return baseAmount / toFactor
}

const convertUnits = ({ amount, category, fromUnit, toUnit }) => {
    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount)) {
        return 0
    }

    const fromConfig = getUnitConfig(category, fromUnit)
    const toConfig = getUnitConfig(category, toUnit)

    if (!fromConfig || !toConfig) {
        return 0
    }

    if (category === 'temperature') {
        return convertTemperature(numericAmount, fromConfig, toConfig)
    }

    return convertByFactor(numericAmount, fromConfig, toConfig)
}

export {
    getUnitOptionsByCategory,
    getDefaultUnitsForCategory,
    convertUnits,
}