const buildFallbackSteps = (items = []) => {

    return items.map((item, index) => ({
        index: index + 1,
        description: `Pack ${item.name} (${item.quantity}x) with similar ${item.category?.toLowerCase?.() ?? 'travel'} items to keep your bag organized.`,
        itemId: item.id,
    }))

}

const getPlanResultSummary = ({ success, totalWeight, baggageLimit }) => {

    if(!success) {
        return `Your bag is currently over the ${baggageLimit.toFixed(1)} kg limit at ${totalWeight.toFixed(1)} kg. Remove or replace a few heavier items and try again.`
    }

    return 'Everything looks good so far. Your packing list is within the baggage limit — continue to generate a packing strategy.'

}

const getStrategySteps = async ({ items = [] }) => {

    if(!items.length) {
        return { steps: [] }
    }

    return { steps: buildFallbackSteps(items) }

}

export {
    getPlanResultSummary,
    getStrategySteps,
}
