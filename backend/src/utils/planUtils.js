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

    const clampUnit = (value, fallback = 0) => {
        const numeric = Number(value)
        if(!Number.isFinite(numeric)) {
            return fallback
        }

        return Math.min(1, Math.max(0, numeric))
    }

    const normalizeBox = (box = {}) => {
        const minSize = 0.08
        let x0 = clampUnit(box?.x0, 0)
        let y0 = clampUnit(box?.y0, 0)
        let x1 = clampUnit(box?.x1, x0 + 0.2)
        let y1 = clampUnit(box?.y1, y0 + 0.2)

        if(x1 <= x0) {
            x1 = Math.min(1, x0 + minSize)
        }

        if(y1 <= y0) {
            y1 = Math.min(1, y0 + minSize)
        }

        return { x0, x1, y0, y1 }
    }

    const normalizeDimensions = (dimensions, fallback = { lengthCm: 20, widthCm: 20, heightCm: 8 }) => ({
        lengthCm: Number(dimensions?.lengthCm) > 0 ? Number(dimensions.lengthCm) : fallback.lengthCm,
        widthCm: Number(dimensions?.widthCm) > 0 ? Number(dimensions.widthCm) : fallback.widthCm,
        heightCm: Number(dimensions?.heightCm) > 0 ? Number(dimensions.heightCm) : fallback.heightCm,
    })

    const steps = strategy.steps.map((step, index) => ({
        index: Number(step?.index) || index + 1,
        description: step?.description || 'Pack this item carefully.',
        itemId: step?.itemId || '',
        suitcaseId: step?.suitcaseId || '',
        placementZone: step?.placementZone || 'main-compartment',
        ...normalizeBox(step),
        itemDimensionsOriginal: normalizeDimensions(step?.itemDimensionsOriginal),
        itemDimensionsPacked: normalizeDimensions(step?.itemDimensionsPacked, normalizeDimensions(step?.itemDimensionsOriginal)),
        packingAdjustment: step?.packingAdjustment || 'none',
        packingAdjustmentReason: step?.packingAdjustmentReason || '',
    }))

    return { steps }
}

export {
    DEFAULT_PLAN_STRATEGY,
    buildDefaultPlanPayload,
    evaluatePlanStatus,
    normalizeStrategy,
}
