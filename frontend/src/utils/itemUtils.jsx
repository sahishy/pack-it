const ITEM_CATEGORY_CONFIG = [
    { name: 'Tops', weight: 0.15, emoji: '👕' },
    { name: 'Bottoms', weight: 0.15, emoji: '👖' },
    { name: 'Outerwear', weight: 0.3, emoji: '🧥' },
    { name: 'Footwear', weight: 0.3, emoji: '👟' },
    { name: 'Underwear', weight: 0.05, emoji: '🩲' },
    { name: 'Accessories', weight: 0.15, emoji: '👜' },
    { name: 'Toiletries', weight: 0.05, emoji: '🧴' },
    { name: 'Electronics', weight: 0.3, emoji: '🔌' },
]

const ITEM_CATEGORIES = ITEM_CATEGORY_CONFIG.map((category) => category.name)
const ITEM_CONFIDENCE_WARNING_THRESHOLD = 0.7

const normalizeCategory = (category) => category?.trim()?.toLowerCase()

const getCategoryConfig = (category) => {
    const normalizedCategory = normalizeCategory(category)
    return ITEM_CATEGORY_CONFIG.find((itemCategory) => normalizeCategory(itemCategory.name) === normalizedCategory)
}

// old category-based weighing, replaced by AI
const estimateItemWeight = ({ category, quantity }) => {
    const categoryConfig = getCategoryConfig(category)
    const baseWeight = categoryConfig?.weight ?? 0
    const numericQuantity = Number(quantity) || 1

    return Number((baseWeight * numericQuantity).toFixed(2))
}

const getCategoryEmoji = (category) => {
    return getCategoryConfig(category)?.emoji ?? '📦'
}

const getResolvedItemWeightKg = (itemWeight) => {
    if(typeof itemWeight === 'number') {
        return itemWeight
    }

    if(itemWeight?.success === true) {
        return Number(itemWeight.weightKg) || 0
    }

    return 0
}

const getResolvedItemDimensionsCm = (dimensions) => {
    if(!dimensions || dimensions?.success !== true) {
        return {
            lengthCm: 0,
            widthCm: 0,
            heightCm: 0,
        }
    }

    return {
        lengthCm: Number(dimensions.lengthCm) || 0,
        widthCm: Number(dimensions.widthCm) || 0,
        heightCm: Number(dimensions.heightCm) || 0,
    }
}

const hasLowConfidence = (confidence) => {
    const numericConfidence = Number(confidence)

    if(!Number.isFinite(numericConfidence)) {
        return false
    }

    return numericConfidence < ITEM_CONFIDENCE_WARNING_THRESHOLD
}

const hasLowItemMetricConfidence = (item) => {
    const weightConfidence = item?.weight?.confidence
    const dimensionsConfidence = item?.dimensions?.confidence

    return hasLowConfidence(weightConfidence) || hasLowConfidence(dimensionsConfidence)
}

const getTotalWeight = (items) => {
    return items.reduce((total, item) => {
        const itemWeight = item?.weight

        if (typeof itemWeight === 'number') {
            return total + itemWeight
        }

        if (itemWeight?.success === true) {
            return total + (Number(itemWeight.weightKg) || 0)
        }

        return total
    }, 0)
}

export {
    ITEM_CATEGORY_CONFIG,
    ITEM_CATEGORIES,
    ITEM_CONFIDENCE_WARNING_THRESHOLD,
    estimateItemWeight,
    getCategoryEmoji,
    getTotalWeight,
    getResolvedItemWeightKg,
    getResolvedItemDimensionsCm,
    hasLowConfidence,
    hasLowItemMetricConfidence,
}