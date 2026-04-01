import countryStandardTips from '../../data/countryStandardTips.json'

const DEFAULT_TIP_PERCENT = 15
const DEFAULT_TIP_RANGE = {
    min: 0,
    max: 30,
}

const normalizeTipRule = (rule) => {
    const low = Number(rule?.tip_low)
    const high = Number(rule?.tip_high)

    return {
        country: rule?.country ?? '',
        tip_low: Number.isFinite(low) ? low : null,
        tip_high: Number.isFinite(high) ? high : null,
        other: rule?.other ?? null,
    }
}

const getTipCountries = () => {
    return [...countryStandardTips]
        .map(normalizeTipRule)
        .sort((a, b) => a.country.localeCompare(b.country))
}

const findTipRule = (countryName) => {
    if (!countryName) {
        return null
    }

    const normalizedCountryName = countryName.trim().toLowerCase()

    return getTipCountries().find((rule) => rule.country.toLowerCase() === normalizedCountryName) ?? null
}

const getTipRange = (countryName) => {
    const rule = findTipRule(countryName)

    if (!rule) {
        return {
            ...DEFAULT_TIP_RANGE,
            other: null,
            hasNumericRange: false,
        }
    }

    const hasNumericRange = Number.isFinite(rule.tip_low) && Number.isFinite(rule.tip_high)

    if (hasNumericRange) {
        return {
            min: rule.tip_low,
            max: rule.tip_high,
            other: null,
            hasNumericRange: true,
        }
    }

    return {
        ...DEFAULT_TIP_RANGE,
        other: rule.other,
        hasNumericRange: false,
    }
}

const getDefaultTipPercent = (countryName) => {
    const { min, max, hasNumericRange } = getTipRange(countryName)

    if (!hasNumericRange) {
        return DEFAULT_TIP_PERCENT
    }

    return Math.round((min + max) / 2)
}

const calculateTipSummary = ({ billAmount, tipPercent, splitBetween }) => {
    const normalizedBillAmount = Math.max(0, Number(billAmount) || 0)
    const normalizedTipPercent = Math.min(100, Math.max(0, Number(tipPercent) || 0))
    const normalizedSplitBetween = Math.max(1, Math.round(Number(splitBetween) || 1))

    const tipAmount = (normalizedBillAmount * normalizedTipPercent) / 100
    const totalAmount = normalizedBillAmount + tipAmount
    const perPersonAmount = totalAmount / normalizedSplitBetween

    return {
        billAmount: normalizedBillAmount,
        tipPercent: normalizedTipPercent,
        splitBetween: normalizedSplitBetween,
        tipAmount,
        totalAmount,
        perPersonAmount,
    }
}

export {
    getTipCountries,
    findTipRule,
    getTipRange,
    getDefaultTipPercent,
    calculateTipSummary,
}