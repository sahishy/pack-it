import { getTotalWeight } from './itemUtils.js'

const DEFAULT_PLAN_STRATEGY = {
    steps: [],
}

const buildDefaultPlanPayload = (uid, tripId) => ({
    userId: uid,
    tripId,
    result: null,
    strategy: DEFAULT_PLAN_STRATEGY,
    createdAt: new Date(),
    updatedAt: new Date(),
})

const evaluatePlanStatus = ({ trip, items }) => {
    const totalWeight = getTotalWeight(items)
    const baggageLimit = Number(trip?.baggageLimit) || 0
    const success = totalWeight <= baggageLimit

    return {
        success,
        totalWeight,
        baggageLimit,
    }
}

const normalizeStrategy = (strategy) => {
    if(!strategy?.steps || !Array.isArray(strategy.steps)) {
        return DEFAULT_PLAN_STRATEGY
    }

    const steps = strategy.steps.map((step, index) => ({
        index: Number(step?.index) || index + 1,
        description: step?.description || 'Pack this item carefully.',
        itemId: step?.itemId || '',
    }))

    return { steps }
}

export {
    DEFAULT_PLAN_STRATEGY,
    buildDefaultPlanPayload,
    evaluatePlanStatus,
    normalizeStrategy,
}
