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

const normalizeCategory = (category) => category?.trim()?.toLowerCase()

const getCategoryConfig = (category) => {
    const normalizedCategory = normalizeCategory(category)
    return ITEM_CATEGORY_CONFIG.find((itemCategory) => normalizeCategory(itemCategory.name) === normalizedCategory)
}

const estimateItemWeight = ({ category, quantity }) => {
    const categoryConfig = getCategoryConfig(category)
    const baseWeight = categoryConfig?.weight ?? 0
    const numericQuantity = Number(quantity) || 1

    return Number((baseWeight * numericQuantity).toFixed(2))
}

const getCategoryEmoji = (category) => {
    return getCategoryConfig(category)?.emoji ?? '📦'
}

const getTotalWeight = (items) => {
    return items.reduce((total, item) => total + (item.weight || 0), 0)
}

export {
    ITEM_CATEGORY_CONFIG,
    ITEM_CATEGORIES,
    estimateItemWeight,
    getCategoryEmoji,
    getTotalWeight,
}