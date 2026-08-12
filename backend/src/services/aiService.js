import OpenAI from 'openai'
import { z } from 'zod'
import { zodTextFormat } from 'openai/helpers/zod'

const ITEM_METRICS_MODEL = 'gpt-5.6-luna'
const PACKING_STRATEGY_MODEL = 'gpt-5.6-luna'
const SUITCASE_VISION_MODEL = 'gpt-5.6-luna'

const ITEM_METRICS_SCHEMA = z.object({
    success: z.boolean(),
    weightKg: z.number(),
    confidenceWeight: z.number(),
    lengthCm: z.number(),
    widthCm: z.number(),
    heightCm: z.number(),
    confidenceDimensions: z.number(),
})

const STRATEGY_SCHEMA = z.object({
    steps: z.array(z.object({
        index: z.number(),
        itemId: z.string(),
        suitcaseId: z.string(),
        placementZone: z.string(),
        description: z.string(),
        packingAdjustment: z.enum(['none', 'folded', 'rolled']),
        packingAdjustmentReason: z.string(),
        itemDimensionsPacked: z.object({
            lengthCm: z.number(),
            widthCm: z.number(),
            heightCm: z.number(),
        }),
    })),
})

const SUITCASE_VISION_SCHEMA = z.object({
    success: z.boolean(),
    name: z.string(),
    lengthCm: z.number(),
    widthCm: z.number(),
    heightCm: z.number(),
    confidenceName: z.number(),
    confidenceDimensions: z.number(),
})

const ITEM_METRICS_PROMPT = `
Estimate shipping weight and packed dimensions for exactly one physical, non-living, packable item.
Return JSON matching the supplied schema. Dimensions are centimeters and weight is kilograms.
Set success=false and every measurement to -1 with confidence 0 for invalid, impossible, living, or too-ambiguous inputs.
For success=true, use positive measurements, confidence values from 0 to 1, and sort dimensions so lengthCm >= widthCm >= heightCm.
Be conservative and do not claim exact manufacturer specifications unless the product is unambiguous.`

const STRATEGY_PROMPT = `
Generate an item-by-item suitcase packing strategy as JSON matching the supplied schema.
Use each input item exactly once. Preserve the exact item and suitcase IDs, but never include raw IDs in descriptions.
When an item has a non-empty suitcaseId, that assignment is a hard constraint: use that exact suitcaseId for the item's strategy step. Only choose a suitcase for items without an existing assignment.
Choose realistic packed dimensions. Heavy items go near the base, fragile items are cushioned, liquids stay upright and sealed, and frequently needed items remain accessible.
When packingAdjustment is "none", itemDimensionsPacked must match the item's original dimensions. When it is "folded" or "rolled", itemDimensionsPacked must materially differ from the original dimensions and reflect a realistic reduced footprint.
Use concise, specific descriptions, balance weight, and select only suitcases present in the input.`

const SUITCASE_VISION_PROMPT = `
Analyze the suitcase image and return JSON only with success, name, lengthCm, widthCm, heightCm, confidenceName, and confidenceDimensions.
Use centimeters and confidence values from 0 to 1. Do not hallucinate a brand or model. If the image is unusable, return success=false, an empty name, all measurements as -1, and confidences as 0.`

const failedMetrics = () => ({
    weight: { success: false, weightKg: -1, confidence: 0, reason: 'Server failure' },
    dimensions: {
        success: false,
        lengthCm: -1,
        widthCm: -1,
        heightCm: -1,
        confidence: 0,
        orientationAssumption: '',
        reason: 'Server failure',
    },
})

const clampConfidence = (value) => Number(Math.min(1, Math.max(0, Number(value) || 0)).toFixed(2))

const positiveNumber = (value, fallback = -1) => {
    const number = Number(value)
    return Number.isFinite(number) && number > 0 ? Number(number.toFixed(2)) : fallback
}

const normalizeMetrics = (value) => {
    if (value?.success !== true) {
        const failed = failedMetrics()
        failed.weight.reason = 'Item not recognized'
        failed.dimensions.reason = 'Item not recognized'
        return failed
    }

    const weightKg = positiveNumber(value.weightKg)
    const lengthCm = positiveNumber(value.lengthCm)
    const widthCm = positiveNumber(value.widthCm)
    const heightCm = positiveNumber(value.heightCm)

    if ([weightKg, lengthCm, widthCm, heightCm].some((measurement) => measurement <= 0)) {
        return failedMetrics()
    }

    return {
        weight: {
            success: true,
            weightKg,
            confidence: clampConfidence(value.confidenceWeight),
            reason: '',
        },
        dimensions: {
            success: true,
            lengthCm,
            widthCm,
            heightCm,
            confidence: clampConfidence(value.confidenceDimensions),
            orientationAssumption: 'Estimated from packed shape. Clothing assumes a laid-flat estimate.',
            reason: '',
        },
    }
}

const callOpenAI = async ({ env, model, prompt, schema, schemaName }) => {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
    const response = await client.responses.parse({
        model,
        reasoning: { effort: 'none' },
        input: [{ role: 'user', content: prompt }],
        text: { format: zodTextFormat(schema, schemaName) },
    })

    return response.output_parsed
}

const predictItemMetrics = async ({ env, name, quantity }) => {
    try {
        const output = await callOpenAI({
            env,
            model: ITEM_METRICS_MODEL,
            prompt: `${ITEM_METRICS_PROMPT}\n\nInput:\n${JSON.stringify({ name, quantity })}`,
            schema: ITEM_METRICS_SCHEMA,
            schemaName: 'item_metrics_prediction',
        })

        return { ...normalizeMetrics(output), meta: { source: 'ai', provider: 'openai', model: ITEM_METRICS_MODEL } }
    } catch {
        return { ...failedMetrics(), meta: { source: 'fallback', provider: 'openai', model: ITEM_METRICS_MODEL } }
    }
}

const normalizeDimensions = (dimensions, fallback = { lengthCm: 20, widthCm: 20, heightCm: 8 }) => ({
    lengthCm: positiveNumber(dimensions?.lengthCm, fallback.lengthCm),
    widthCm: positiveNumber(dimensions?.widthCm, fallback.widthCm),
    heightCm: positiveNumber(dimensions?.heightCm, fallback.heightCm),
})

const getSuitcaseVolume = (suitcase) => {
    const dimensions = normalizeDimensions(suitcase?.dimensions, { lengthCm: 70, widthCm: 45, heightCm: 30 })
    return dimensions.lengthCm * dimensions.widthCm * dimensions.heightCm
}

const foldableItem = (item) => {
    const text = `${item?.category ?? ''} ${item?.name ?? ''}`.toLowerCase()
    return ['top', 'shirt', 'bottom', 'pant', 'jean', 'underwear', 'outerwear', 'hoodie', 'sweater', 'dress', 'skirt'].some((keyword) => text.includes(keyword))
}

const getAdjustedDimensions = (original, adjustment) => {
    if (adjustment === 'rolled') {
        return {
            lengthCm: Number(Math.max(5, original.widthCm * 0.6).toFixed(2)),
            widthCm: Number(Math.max(4, original.heightCm * 2).toFixed(2)),
            heightCm: Number(Math.max(4, original.heightCm * 2).toFixed(2)),
        }
    }

    return {
        lengthCm: Number((original.lengthCm * 0.5).toFixed(2)),
        widthCm: Number((original.widthCm * 0.5).toFixed(2)),
        heightCm: Number(Math.max(2, original.heightCm * 1.5).toFixed(2)),
    }
}

const hasMeaningfulDimensionChange = (original, packed) => (
    ['lengthCm', 'widthCm', 'heightCm'].some((key) => (
        Math.abs(packed[key] - original[key]) >= Math.max(0.5, original[key] * 0.05)
    ))
)

const getPackedModel = (item) => {
    const original = normalizeDimensions(item?.dimensions)

    if (!foldableItem(item)) {
        return {
            original,
            packed: original,
            adjustment: 'none',
            reason: 'Packed as-is for shape stability.',
        }
    }

    return {
        original,
        packed: getAdjustedDimensions(original, 'folded'),
        adjustment: 'folded',
        reason: 'Folded to reduce footprint and improve stacking.',
    }
}

const sanitizeDescription = (description, itemId) => String(description ?? '')
    .replaceAll(String(itemId ?? ''), '')
    .replace(/\bitem[_-]?\d+\b/gi, '')
    .replace(/\b[a-f0-9]{8}-[a-f0-9-]{27,}\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

const findOwnerHint = (name) => String(name ?? '').match(/^\s*([a-z]+)'s\b/i)?.[1]?.toLowerCase() ?? ''

const buildFallbackStrategy = (items, suitcases) => {
    const availableSuitcases = suitcases.length ? suitcases : [{
        id: 'default_suitcase',
        name: 'Main Suitcase',
        dimensions: { lengthCm: 70, widthCm: 45, heightCm: 30 },
    }]
    const remaining = new Map(availableSuitcases.map((suitcase) => [suitcase.id, getSuitcaseVolume(suitcase)]))

    return {
        steps: [...items]
            .sort((left, right) => (Number(right?.weight?.weightKg) || 0) - (Number(left?.weight?.weightKg) || 0))
            .map((item, index) => {
                const assignedSuitcase = item.suitcaseId
                    ? availableSuitcases.find((suitcase) => suitcase.id === item.suitcaseId)
                    : null
                const ownerHint = findOwnerHint(item.name)
                const ownerSuitcase = ownerHint
                    ? availableSuitcases.find((suitcase) => String(suitcase.name).toLowerCase().includes(ownerHint))
                    : null
                const suitcase = assignedSuitcase
                    ?? ownerSuitcase
                    ?? [...availableSuitcases].sort((left, right) => (remaining.get(right.id) ?? 0) - (remaining.get(left.id) ?? 0))[0]
                const packedModel = getPackedModel(item)
                const packedVolume = packedModel.packed.lengthCm * packedModel.packed.widthCm * packedModel.packed.heightCm
                remaining.set(suitcase.id, Math.max(0, (remaining.get(suitcase.id) ?? 0) - packedVolume))

                return {
                    index: index + 1,
                    itemId: item.id,
                    suitcaseId: suitcase.id,
                    placementZone: 'main-compartment',
                    description: `Pack ${item.name} in ${suitcase.name}. Keep weight balanced and related items together.`,
                    packingAdjustment: packedModel.adjustment,
                    packingAdjustmentReason: packedModel.reason,
                    itemDimensionsOriginal: packedModel.original,
                    itemDimensionsPacked: packedModel.packed,
                }
            }),
    }
}

const normalizeStrategy = (generated, fallback, suitcases, items) => {
    const fallbackByItem = new Map(fallback.steps.map((step) => [step.itemId, step]))
    const allowedSuitcases = new Set(suitcases.map((suitcase) => suitcase.id))
    const assignedSuitcaseByItemId = new Map(items
        .filter((item) => item.suitcaseId && allowedSuitcases.has(item.suitcaseId))
        .map((item) => [item.id, item.suitcaseId]))

    return {
        steps: generated.steps.map((step, index) => {
            const fallbackStep = fallbackByItem.get(step.itemId) ?? fallback.steps[index]
            const suitcaseId = assignedSuitcaseByItemId.get(fallbackStep.itemId)
                ?? (allowedSuitcases.has(step.suitcaseId) ? step.suitcaseId : fallbackStep.suitcaseId)
            const packingAdjustment = step.packingAdjustment || fallbackStep.packingAdjustment
            const originalDimensions = fallbackStep.itemDimensionsOriginal
            const generatedPackedDimensions = normalizeDimensions(step.itemDimensionsPacked, fallbackStep.itemDimensionsPacked)
            const packedDimensions = packingAdjustment === 'none'
                ? originalDimensions
                : hasMeaningfulDimensionChange(originalDimensions, generatedPackedDimensions)
                    ? generatedPackedDimensions
                    : getAdjustedDimensions(originalDimensions, packingAdjustment)

            return {
                index: index + 1,
                itemId: fallbackStep.itemId,
                suitcaseId,
                placementZone: step.placementZone || fallbackStep.placementZone,
                description: sanitizeDescription(step.description, fallbackStep.itemId) || fallbackStep.description,
                packingAdjustment,
                packingAdjustmentReason: step.packingAdjustmentReason || fallbackStep.packingAdjustmentReason,
                itemDimensionsOriginal: originalDimensions,
                itemDimensionsPacked: packedDimensions,
            }
        }),
    }
}

const generatePackingStrategy = async ({ env, items, suitcases }) => {
    const resolvedSuitcases = suitcases.length ? suitcases : [{
        id: 'default_suitcase',
        name: 'Main Suitcase',
        dimensions: { lengthCm: 70, widthCm: 45, heightCm: 30 },
    }]
    const fallback = buildFallbackStrategy(items, resolvedSuitcases)

    if (!items.length) {
        return { strategy: fallback, meta: { source: 'ai', provider: 'openai', model: PACKING_STRATEGY_MODEL } }
    }

    try {
        const output = await callOpenAI({
            env,
            model: PACKING_STRATEGY_MODEL,
            prompt: `${STRATEGY_PROMPT}\n\nInput:\n${JSON.stringify({ items, suitcases: resolvedSuitcases })}`,
            schema: STRATEGY_SCHEMA,
            schemaName: 'packing_strategy',
        })

        const expectedItemIds = new Set(items.map((item) => item.id))
        const generatedItemIds = new Set(output?.steps?.map((step) => step.itemId) ?? [])

        if (!output?.steps?.length
            || output.steps.length !== items.length
            || generatedItemIds.size !== expectedItemIds.size
            || [...generatedItemIds].some((itemId) => !expectedItemIds.has(itemId))) {
            return { strategy: fallback, meta: { source: 'fallback', provider: 'openai', model: PACKING_STRATEGY_MODEL } }
        }

        return {
            strategy: normalizeStrategy(output, fallback, resolvedSuitcases, items),
            meta: { source: 'ai', provider: 'openai', model: PACKING_STRATEGY_MODEL },
        }
    } catch {
        return { strategy: fallback, meta: { source: 'fallback', provider: 'openai', model: PACKING_STRATEGY_MODEL } }
    }
}

const failedVisionPrediction = () => ({
    success: false,
    name: '',
    dimensions: { lengthCm: -1, widthCm: -1, heightCm: -1 },
    confidenceName: 0,
    confidenceDimensions: 0,
})

const toTitleCase = (value) => String(value ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())

const analyzeSuitcaseImage = async ({ env, imageBytes, mimeType }) => {
    try {
        const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
        const response = await client.responses.parse({
            model: SUITCASE_VISION_MODEL,
            reasoning: { effort: 'none' },
            input: [{
                role: 'user',
                content: [
                    { type: 'input_text', text: SUITCASE_VISION_PROMPT },
                    {
                        type: 'input_image',
                        detail: 'high',
                        image_url: `data:${mimeType};base64,${Buffer.from(imageBytes).toString('base64')}`,
                    },
                ],
            }],
            text: { format: zodTextFormat(SUITCASE_VISION_SCHEMA, 'suitcase_vision_prediction') },
        })
        const parsed = response.output_parsed
        const dimensions = {
            lengthCm: positiveNumber(parsed?.lengthCm),
            widthCm: positiveNumber(parsed?.widthCm),
            heightCm: positiveNumber(parsed?.heightCm),
        }

        if (parsed?.success !== true || Object.values(dimensions).some((value) => value <= 0)) {
            return { prediction: failedVisionPrediction(), meta: { source: 'fallback', provider: 'openai', model: SUITCASE_VISION_MODEL } }
        }

        return {
            prediction: {
                success: true,
                name: toTitleCase(parsed.name) || 'Generic Suitcase',
                dimensions,
                confidenceName: clampConfidence(parsed.confidenceName),
                confidenceDimensions: clampConfidence(parsed.confidenceDimensions),
            },
            meta: { source: 'ai', provider: 'openai', model: SUITCASE_VISION_MODEL },
        }
    } catch {
        return { prediction: failedVisionPrediction(), meta: { source: 'fallback', provider: 'openai', model: SUITCASE_VISION_MODEL } }
    }
}

export { analyzeSuitcaseImage, generatePackingStrategy, predictItemMetrics }
