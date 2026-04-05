import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAI, GoogleAIBackend, getGenerativeModel, Schema } from 'firebase/ai'
import config from '../config.js'

const ITEM_METRICS_PROMPT = `
Estimate both item weight and packed dimensions from the provided input.

Return JSON only:
{
  "success": boolean,
  "weightKg": number,
  "confidenceWeight": number,
  "lengthCm": number,
  "widthCm": number,
  "heightCm": number,
  "confidenceDimensions": number
}

Rules:
- success=true only for a real, logical, non-living, packable item.
- If the item is unknown but plausible, estimate from item type, use, material, and quantity.
- Unknown but reasonable product names should still succeed.
- Reject animals, people, impossible/fantasy objects, or non-packable concepts.
- If success=false, use weightKg=-1, lengthCm=-1, widthCm=-1, heightCm=-1.
- Return confidence values between 0 and 1 for both weight and dimensions.
- Use kilograms and centimeters only.
- For clothing and soft garments, dimensions should assume the item is laid out flat.
- No extra keys. No explanation.
`

const SUITCASE_VISION_PROMPT = `
You are given one suitcase image.

Extract best-effort suitcase details and return JSON only:
{
  "success": boolean,
  "name": string,
  "lengthCm": number,
  "widthCm": number,
  "heightCm": number,
  "confidenceName": number,
  "confidenceDimensions": number
}

Rules:
- Naming priority:
  1) If you can reliably identify an exact product, use: "Brand Line/Model Size".
  2) If exact model is uncertain but brand is likely, use: "Brand + descriptive suitcase type".
  3) If brand/model are not reliable, use a generic descriptive suitcase name in Title Case.
- Do not hallucinate brand or model names. Lower confidence when inferred.
- Prefer concise, shopper-facing naming that a user would recognize. Ex. Blue Samsonite Suitcase, Pink Travelpro Luggage
- Return confidence values in [0, 1].
- Dimensions must be centimeters.
- If uncertain, still provide your best estimate but lower confidence.
- If completely unusable image, success=false and all numeric fields = -1.
- No extra keys. No explanation.
`

const ITEM_METRICS_SCHEMA = Schema.object({
    properties: {
        success: Schema.boolean(),
        weightKg: Schema.number(),
        confidenceWeight: Schema.number(),
        lengthCm: Schema.number(),
        widthCm: Schema.number(),
        heightCm: Schema.number(),
        confidenceDimensions: Schema.number(),
    },
})

const SUITCASE_VISION_SCHEMA = Schema.object({
    properties: {
        success: Schema.boolean(),
        name: Schema.string(),
        lengthCm: Schema.number(),
        widthCm: Schema.number(),
        heightCm: Schema.number(),
        confidenceName: Schema.number(),
        confidenceDimensions: Schema.number(),
    },
})

const firebaseConfig = {
    apiKey: config.firebaseApiKey,
    authDomain: config.firebaseAuthDomain,
    projectId: config.firebaseProjectId,
    storageBucket: config.firebaseStorageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.firebaseAppId,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const ai = getAI(app, { backend: new GoogleAIBackend() })

const itemModel = getGenerativeModel(ai, {
    model: 'gemini-2.5-flash-lite',
})
const visionModel = getGenerativeModel(ai, {
    model: 'gemini-2.5-flash-lite',
})
const strategyModel = getGenerativeModel(ai, {
    model: 'gemini-2.5-flash-lite',
})

const clampConfidence = (value) => {
    const numericValue = Number(value)

    if(!Number.isFinite(numericValue)) {
        return 0
    }

    return Number(Math.min(1, Math.max(0, numericValue)).toFixed(2))
}

const toPositiveNumber = (value, fallback = -1) => {
    const numericValue = Number(value)

    if(!Number.isFinite(numericValue) || numericValue <= 0) {
        return fallback
    }

    return Number(numericValue.toFixed(2))
}

const extractJsonFromModelText = (rawText = '') => {
    const text = String(rawText ?? '').trim()

    if(!text) {
        return '{}'
    }

    const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)

    if(fencedMatch?.[1]) {
        return fencedMatch[1].trim()
    }

    const objectStart = text.indexOf('{')
    const objectEnd = text.lastIndexOf('}')

    if(objectStart >= 0 && objectEnd > objectStart) {
        return text.slice(objectStart, objectEnd + 1)
    }

    return text
}

const safeParseModelJson = (rawText, label = 'model output') => {
    const extracted = extractJsonFromModelText(rawText)

    try {
        return {
            parsed: JSON.parse(extracted),
            parseError: null,
        }
    } catch (error) {
        const parseError = new Error(`Failed to parse ${label}: ${error.message}`)
        parseError.cause = error
        parseError.rawText = String(rawText ?? '')
        parseError.extracted = extracted
        throw parseError
    }
}

const toTitleCase = (value = '') => {
    const normalized = String(value ?? '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    if(!normalized) {
        return ''
    }

    return normalized
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase())
}


const sanitizeDescription = (description = '', itemId = '') => {
    const descriptionText = String(description ?? '')

    if(!descriptionText) {
        return ''
    }

    let sanitized = itemId
        ? descriptionText.replaceAll(String(itemId), '')
        : descriptionText

    sanitized = sanitized
        .replace(/\bitem[_-]?\d+\b/gi, '')
        .replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()

    return sanitized
}

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

const normalizeItemMetricsPrediction = (value) => {
    if(value?.success !== true) {
        return {
            weight: {
                success: false,
                weightKg: -1,
                confidence: 0,
                reason: 'Item not recognized',
            },
            dimensions: {
                success: false,
                lengthCm: -1,
                widthCm: -1,
                heightCm: -1,
                confidence: 0,
                orientationAssumption: '',
                reason: 'Item not recognized',
            },
        }
    }

    const weightKg = toPositiveNumber(value?.weightKg)
    const lengthCm = toPositiveNumber(value?.lengthCm)
    const widthCm = toPositiveNumber(value?.widthCm)
    const heightCm = toPositiveNumber(value?.heightCm)

    if(weightKg <= 0 || lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
        return {
            weight: {
                success: false,
                weightKg: -1,
                confidence: 0,
                reason: 'Server failure',
            },
            dimensions: {
                success: false,
                lengthCm: -1,
                widthCm: -1,
                heightCm: -1,
                confidence: 0,
                orientationAssumption: '',
                reason: 'Server failure',
            },
        }
    }

    return {
        weight: {
            success: true,
            weightKg,
            confidence: clampConfidence(value?.confidenceWeight),
            reason: '',
        },
        dimensions: {
            success: true,
            lengthCm,
            widthCm,
            heightCm,
            confidence: clampConfidence(value?.confidenceDimensions),
            orientationAssumption: 'Estimated from packed shape. Clothing assumes a laid-flat estimate.',
            reason: '',
        },
    }

}

const getPredictedItemMetrics = async ({ name = '', category = '', quantity = 1 } = {}) => {
    const fallback = {
        weight: {
            success: false,
            weightKg: -1,
            confidence: 0,
            reason: 'Server failure',
        },
        dimensions: {
            success: false,
            lengthCm: -1,
            widthCm: -1,
            heightCm: -1,
            confidence: 0,
            orientationAssumption: '',
            reason: 'Server failure',
        },
    }

    const payload = {
        item: {
            name: String(name ?? '').trim(),
            category: String(category ?? '').trim(),
            quantity: Number(quantity) || 1,
        },
    }

    const fullPrompt = `${ITEM_METRICS_PROMPT}\n\nInput:\n${JSON.stringify(payload)}`
    const contents = [{
        role: 'user',
        parts: [{ text: fullPrompt }],
    }]

    try {
        const result = await itemModel.generateContent({
            contents,
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: ITEM_METRICS_SCHEMA,
            },
        })

        const rawText = result?.response?.text?.() ?? '{}'
        const { parsed } = safeParseModelJson(rawText, 'item metrics response')
        return normalizeItemMetricsPrediction(parsed)
    } catch (error) {
        console.error('Failed to predict item metrics with Gemini. Falling back to failed response.', error)
        return fallback
    }
}

const normalizeSuitcaseVisionPrediction = (value) => {
    if(value?.success !== true) {
        return {
            success: false,
            name: '',
            dimensions: {
                lengthCm: -1,
                widthCm: -1,
                heightCm: -1,
            },
            confidenceName: 0,
            confidenceDimensions: 0,
        }
    }

    const lengthCm = toPositiveNumber(value?.lengthCm)
    const widthCm = toPositiveNumber(value?.widthCm)
    const heightCm = toPositiveNumber(value?.heightCm)

    if(lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
        return {
            success: false,
            name: '',
            dimensions: {
                lengthCm: -1,
                widthCm: -1,
                heightCm: -1,
            },
            confidenceName: 0,
            confidenceDimensions: 0,
        }
    }

    return {
        success: true,
        name: toTitleCase(String(value?.name ?? '').trim()) || 'Generic Suitcase',
        dimensions: {
            lengthCm,
            widthCm,
            heightCm,
        },
        confidenceName: clampConfidence(value?.confidenceName),
        confidenceDimensions: clampConfidence(value?.confidenceDimensions),
    }
}

const getPredictedSuitcaseFromImage = async ({ imageBuffer = null, imageBase64 = '', mimeType = 'image/jpeg' } = {}) => {
    const resolvedImageBase64 = imageBase64 || (imageBuffer ? Buffer.from(imageBuffer).toString('base64') : '')

    if(!resolvedImageBase64) {
        return {
            success: false,
            name: '',
            dimensions: {
                lengthCm: -1,
                widthCm: -1,
                heightCm: -1,
            },
            confidenceName: 0,
            confidenceDimensions: 0,
        }
    }

    try {
        const requestPayload = {
            contents: [{
                role: 'user',
                parts: [
                    { text: SUITCASE_VISION_PROMPT },
                    {
                        inlineData: {
                            mimeType,
                            data: resolvedImageBase64,
                        },
                    },
                ],
            }],
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: SUITCASE_VISION_SCHEMA,
            },
        }

        let result

        try {
            result = await visionModel.generateContent({
                ...requestPayload,
                // google search for suitcase vision
                tools: [{ googleSearch: {} }],
            })
        } catch (searchError) {
            console.warn('Suitcase vision grounding failed; retrying without Google Search.', searchError)
            result = await visionModel.generateContent(requestPayload)
        }

        const rawText = result?.response?.text?.() ?? '{}'
        const { parsed } = safeParseModelJson(rawText, 'suitcase vision response')
        return normalizeSuitcaseVisionPrediction(parsed)
    } catch (error) {
        console.error('Failed to analyze suitcase image with Gemini.', error)
        return {
            success: false,
            name: '',
            dimensions: {
                lengthCm: -1,
                widthCm: -1,
                heightCm: -1,
            },
            confidenceName: 0,
            confidenceDimensions: 0,
        }
    }
}

const getItemVolume = (item) => {
    const dimensions = item?.dimensions
    const lengthCm = Number(dimensions?.lengthCm)
    const widthCm = Number(dimensions?.widthCm)
    const heightCm = Number(dimensions?.heightCm)

    if(!Number.isFinite(lengthCm) || !Number.isFinite(widthCm) || !Number.isFinite(heightCm) || lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
        return 1000
    }

    return lengthCm * widthCm * heightCm
}

const getSuitcaseVolume = (suitcase) => {
    const dimensions = suitcase?.dimensions
    const lengthCm = Number(dimensions?.lengthCm)
    const widthCm = Number(dimensions?.widthCm)
    const heightCm = Number(dimensions?.heightCm)

    if(!Number.isFinite(lengthCm) || !Number.isFinite(widthCm) || !Number.isFinite(heightCm) || lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
        return 1
    }

    return lengthCm * widthCm * heightCm
}

const toSafeDimension = (value, fallback = 20) => {
    const numericValue = Number(value)

    if(!Number.isFinite(numericValue) || numericValue <= 0) {
        return fallback
    }

    return numericValue
}

const normalizeItemDimensions = (item = {}) => {
    return {
        lengthCm: toSafeDimension(item?.dimensions?.lengthCm, 20),
        widthCm: toSafeDimension(item?.dimensions?.widthCm, 20),
        heightCm: toSafeDimension(item?.dimensions?.heightCm, 8),
    }
}

const FOLDABLE_CATEGORIES = new Set([
    'tops',
    'bottoms',
    'underwear',
    'outerwear',
])

const FOLDABLE_KEYWORDS = ['shirt', 't-shirt', 'jeans', 'pants', 'shorts', 'hoodie', 'sweater', 'jacket', 'dress', 'skirt']

const isFoldableItem = (item = {}) => {
    const category = String(item?.category ?? '').toLowerCase().trim()

    if(FOLDABLE_CATEGORIES.has(category)) {
        return true
    }

    const name = String(item?.name ?? '').toLowerCase()
    return FOLDABLE_KEYWORDS.some((keyword) => name.includes(keyword))
}

const getPackedDimensionsForItem = (item = {}) => {
    const original = normalizeItemDimensions(item)

    if(!isFoldableItem(item)) {
        return {
            original,
            packed: original,
            packingAdjustment: 'none',
            packingAdjustmentReason: 'Packed as-is for shape stability.',
        }
    }

    const folded = {
        lengthCm: Number((original.lengthCm * 0.5).toFixed(2)),
        widthCm: Number((original.widthCm * 0.5).toFixed(2)),
        heightCm: Number(Math.max(2, original.heightCm * 1.5).toFixed(2)),
    }

    return {
        original,
        packed: folded,
        packingAdjustment: 'folded',
        packingAdjustmentReason: 'Folded to reduce footprint and improve stacking in suitcase layers.',
    }
}

const STRATEGY_STAGE_A_PROMPT = `
Generate an item-by-item packing strategy.

Return JSON only:
{
  "steps": [
    {
      "index": number,
      "itemId": string,
      "suitcaseId": string,
      "placementZone": string,
      "description": string,
      "packingAdjustment": "none" | "folded" | "rolled",
      "packingAdjustmentReason": string,
      "itemDimensionsPacked": { "lengthCm": number, "widthCm": number, "heightCm": number }
    }
  ]
}

Rules:
- Use natural, specific step descriptions. Avoid repetitive templated phrasing.
- Respect owner-name hints (e.g., "John's ..." should prefer "John's Suitcase").
- Keep packed dimensions realistic; clothing can be folded.
- No extra keys. No explanation.
`

const STRATEGY_STAGE_B_PROMPT = `
You place already-planned items in a suitcase as normalized 2D rectangles viewed from above.

Coordinate system:
- x-axis = suitcase width (left → right)
- y-axis = suitcase length (top → bottom)
- All values are in [0, 1], where 1.0 = full suitcase width or length

To compute each item's box size, use these formulas:
  boxWidth  = itemDimensionsPacked.widthCm  / suitcase.dimensions.widthCm
  boxHeight = itemDimensionsPacked.lengthCm / suitcase.dimensions.lengthCm

Clamp boxWidth and boxHeight to a minimum of 0.05 and maximum of 0.95.

Place items row by row, left to right, starting from (0.02, 0.02). Leave a 0.02 gap between items.
When a row is full (x0 + boxWidth > 0.95), wrap to the next row: reset x to 0.02 and advance y by the tallest item in the previous row plus the gap.

Return JSON only:
{
  "placements": [
    {
      "itemId": string,
      "suitcaseId": string,
      "x0": number,
      "x1": number,
      "y0": number,
      "y1": number
    }
  ]
}

Rules:
- x1 = x0 + boxWidth, y1 = y0 + boxHeight. Always x1 > x0 and y1 > y0.
- No overlaps within the same suitcase.
- All coordinates within [0, 1].
- No extra keys. No explanation.
`

const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0))

const findOwnerHint = (text = '') => {
    const ownerMatch = String(text).match(/^\s*([a-z]+)'s\b/i)
    return ownerMatch?.[1]?.toLowerCase?.() ?? ''
}

const resolveSuitcases = (suitcases = []) => {
    return suitcases.length
        ? suitcases
        : [{
            id: 'default_suitcase',
            name: 'Main Suitcase',
            dimensions: {
                lengthCm: 70,
                widthCm: 45,
                heightCm: 30,
            },
        }]
}

const pickSuitcaseForItem = ({ item, suitcases = [], remainingBySuitcase = new Map() }) => {
    if(!suitcases.length) {
        return null
    }

    const itemOwner = findOwnerHint(item?.name)

    if(itemOwner) {
        const ownerMatch = suitcases.find((suitcase) => String(suitcase?.name ?? '').toLowerCase().includes(itemOwner))
        if(ownerMatch) {
            return ownerMatch
        }
    }

    let bestSuitcase = suitcases[0]
    let bestRemaining = remainingBySuitcase.get(bestSuitcase.id) ?? getSuitcaseVolume(bestSuitcase)

    for(const suitcase of suitcases) {
        const remaining = remainingBySuitcase.get(suitcase.id) ?? getSuitcaseVolume(suitcase)

        if(remaining > bestRemaining) {
            bestRemaining = remaining
            bestSuitcase = suitcase
        }
    }

    return bestSuitcase
}

const buildSemanticFallback = ({ items = [], suitcases = [] }) => {
    const resolvedSuitcases = resolveSuitcases(suitcases)
    const remainingBySuitcase = new Map(resolvedSuitcases.map((suitcase) => [suitcase.id, getSuitcaseVolume(suitcase)]))

    const sortedItems = [...items].sort((a, b) => (Number(b?.weight?.weightKg) || 0) - (Number(a?.weight?.weightKg) || 0))

    return {
        steps: sortedItems.map((item, index) => {
            const packedModel = getPackedDimensionsForItem(item)
            const suitcase = pickSuitcaseForItem({ item, suitcases: resolvedSuitcases, remainingBySuitcase })
            const suitcaseId = suitcase?.id ?? resolvedSuitcases[0]?.id ?? 'default_suitcase'
            const suitcaseName = suitcase?.name ?? 'Main Suitcase'
            const packedVolume = packedModel.packed.lengthCm * packedModel.packed.widthCm * packedModel.packed.heightCm
            const remaining = remainingBySuitcase.get(suitcaseId) ?? 0
            remainingBySuitcase.set(suitcaseId, Math.max(0, remaining - packedVolume))

            return {
                index: index + 1,
                itemId: item.id,
                suitcaseId,
                placementZone: 'main-compartment',
                description: sanitizeDescription(`Pack ${item.name} in ${suitcaseName}. Keep weight balanced and group related items together.`, item.id),
                packingAdjustment: packedModel.packingAdjustment,
                packingAdjustmentReason: packedModel.packingAdjustmentReason,
                itemDimensionsOriginal: packedModel.original,
                itemDimensionsPacked: packedModel.packed,
            }
        }),
    }
}

const getStrategySemanticSteps = async ({ items = [], suitcases = [] }) => {
    if(!items.length) {
        return { steps: [], meta: { source: 'ai', error: null } }
    }

    const resolvedSuitcases = resolveSuitcases(suitcases)
    const fallback = buildSemanticFallback({ items, suitcases: resolvedSuitcases })
    const fallbackByItemId = new Map(fallback.steps.map((step) => [step.itemId, step]))

    const payload = {
        suitcases: resolvedSuitcases.map((suitcase) => ({
            id: suitcase.id,
            name: suitcase.name,
            dimensions: suitcase.dimensions,
        })),
        items: items.map((item) => {
            const packedModel = getPackedDimensionsForItem(item)
            return {
                id: item.id,
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                dimensions: packedModel.original,
                suggestedPackedDimensions: packedModel.packed,
                suggestedPackingAdjustment: packedModel.packingAdjustment,
            }
        }),
    }

    try {
        const result = await strategyModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: `${STRATEGY_STAGE_A_PROMPT}\n\nInput:\n${JSON.stringify(payload)}` }] }],
        })

        const rawText = result?.response?.text?.() ?? '{}'
        const { parsed } = safeParseModelJson(rawText, 'strategy stage A response')
        const generatedSteps = Array.isArray(parsed?.steps) ? parsed.steps : []

        if(!generatedSteps.length) {
            return {
                ...fallback,
                meta: {
                    source: 'fallback',
                    error: 'Stage A returned no valid steps.',
                },
            }
        }

        const steps = generatedSteps.map((step, index) => {
            const fallbackStep = fallbackByItemId.get(step?.itemId) ?? fallback.steps[index] ?? {}

            return {
                index: Number(step?.index) || index + 1,
                itemId: step?.itemId || fallbackStep.itemId || '',
                suitcaseId: step?.suitcaseId || fallbackStep.suitcaseId || resolvedSuitcases[0].id,
                placementZone: step?.placementZone || fallbackStep.placementZone || 'main-compartment',
                description: sanitizeDescription(step?.description, step?.itemId) || fallbackStep.description,
                packingAdjustment: step?.packingAdjustment || fallbackStep.packingAdjustment || 'none',
                packingAdjustmentReason: String(step?.packingAdjustmentReason ?? fallbackStep.packingAdjustmentReason ?? ''),
                itemDimensionsOriginal: fallbackStep.itemDimensionsOriginal ?? normalizeItemDimensions({}),
                itemDimensionsPacked: {
                    lengthCm: toSafeDimension(step?.itemDimensionsPacked?.lengthCm, fallbackStep.itemDimensionsPacked?.lengthCm ?? 20),
                    widthCm: toSafeDimension(step?.itemDimensionsPacked?.widthCm, fallbackStep.itemDimensionsPacked?.widthCm ?? 20),
                    heightCm: toSafeDimension(step?.itemDimensionsPacked?.heightCm, fallbackStep.itemDimensionsPacked?.heightCm ?? 8),
                },
            }
        })

        return {
            steps,
            meta: {
                source: 'ai',
                error: null,
            },
        }
    } catch (error) {
        console.error('Failed Stage A strategy generation. Using fallback.', error)
        return {
            ...fallback,
            meta: {
                source: 'fallback',
                error: error?.message ?? 'Unknown Stage A failure.',
            },
        }
    }
}

const overlaps = (a, b) => !(a.x1 <= b.x0 || a.x0 >= b.x1 || a.y1 <= b.y0 || a.y0 >= b.y1)

const normalizeBox = (box = {}) => {
    const minSize = 0.08
    let x0 = clamp01(box?.x0)
    let y0 = clamp01(box?.y0)
    let x1 = clamp01(box?.x1)
    let y1 = clamp01(box?.y1)

    if(x1 <= x0) {
        x1 = Math.min(1, x0 + minSize)
    }
    if(y1 <= y0) {
        y1 = Math.min(1, y0 + minSize)
    }

    if((x1 - x0) < minSize) {
        x1 = Math.min(1, x0 + minSize)
    }
    if((y1 - y0) < minSize) {
        y1 = Math.min(1, y0 + minSize)
    }

    if(x1 > 1) {
        const width = x1 - x0
        x1 = 1
        x0 = Math.max(0, x1 - width)
    }
    if(y1 > 1) {
        const height = y1 - y0
        y1 = 1
        y0 = Math.max(0, y1 - height)
    }

    return {
        x0: Number(x0.toFixed(4)),
        x1: Number(x1.toFixed(4)),
        y0: Number(y0.toFixed(4)),
        y1: Number(y1.toFixed(4)),
    }
}

const buildDeterministicLayout = ({ steps = [], suitcases = [] }) => {
    const suitcaseById = new Map(suitcases.map((suitcase) => [suitcase.id, suitcase]))
    const stateBySuitcase = new Map()
    const placements = []
    const gap = 0.02

    for(const step of steps) {
        const suitcase = suitcaseById.get(step.suitcaseId)
        const suitcaseLength = Number(suitcase?.dimensions?.lengthCm) || 70
        const suitcaseWidth = Number(suitcase?.dimensions?.widthCm) || 45
        const packed = step?.itemDimensionsPacked ?? { lengthCm: 20, widthCm: 20 }
        const boxWidth = Math.min(0.45, Math.max(0.1, toSafeDimension(packed?.widthCm, 20) / suitcaseWidth))
        const boxHeight = Math.min(0.45, Math.max(0.1, toSafeDimension(packed?.lengthCm, 20) / suitcaseLength))

        const state = stateBySuitcase.get(step.suitcaseId) ?? { x: gap, y: gap, rowHeight: 0 }

        if(state.x + boxWidth > 1 - gap) {
            state.x = gap
            state.y += state.rowHeight + gap
            state.rowHeight = 0
        }

        if(state.y + boxHeight > 1 - gap) {
            state.y = Math.max(gap, 1 - boxHeight - gap)
        }

        const box = normalizeBox({
            x0: state.x,
            y0: state.y,
            x1: state.x + boxWidth,
            y1: state.y + boxHeight,
        })

        placements.push({ itemId: step.itemId, suitcaseId: step.suitcaseId, ...box })

        state.x += boxWidth + gap
        state.rowHeight = Math.max(state.rowHeight, boxHeight)
        stateBySuitcase.set(step.suitcaseId, state)
    }

    return placements
}

const resolvePlacementOverlaps = (placements = []) => {
    const grouped = placements.reduce((accumulator, placement) => {
        const key = placement.suitcaseId || 'default_suitcase'
        if(!accumulator[key]) {
            accumulator[key] = []
        }
        accumulator[key].push(normalizeBox(placement))
        accumulator[key][accumulator[key].length - 1].itemId = placement.itemId
        accumulator[key][accumulator[key].length - 1].suitcaseId = placement.suitcaseId
        return accumulator
    }, {})

    const resolved = []

    for(const suitcasePlacements of Object.values(grouped)) {
        const settled = []

        for(const placement of suitcasePlacements) {
            let next = { ...placement }
            let attempts = 0

            while(settled.some((existing) => overlaps(existing, next)) && attempts < 30) {
                const width = next.x1 - next.x0
                const height = next.y1 - next.y0
                let x0 = next.x0 + 0.03
                let y0 = next.y0

                if(x0 + width > 1) {
                    x0 = 0.02
                    y0 = Math.min(1 - height, next.y0 + 0.03)
                }

                next = normalizeBox({ x0, y0, x1: x0 + width, y1: y0 + height })
                next.itemId = placement.itemId
                next.suitcaseId = placement.suitcaseId
                attempts += 1
            }

            settled.push(next)
            resolved.push(next)
        }
    }

    return resolved
}

const getStrategyLayoutSteps = async ({ semanticSteps = [], suitcases = [] }) => {
    if(!semanticSteps.length) {
        return { steps: [], meta: { source: 'ai', error: null } }
    }

    const resolvedSuitcases = resolveSuitcases(suitcases)
    const fallbackPlacements = buildDeterministicLayout({ steps: semanticSteps, suitcases: resolvedSuitcases })
    let candidatePlacements = fallbackPlacements
    let stageBMeta = {
        source: 'fallback',
        error: 'Stage B fallback used.',
    }

    const payload = {
        suitcases: resolvedSuitcases.map((suitcase) => ({
            id: suitcase.id,
            name: suitcase.name,
            dimensions: suitcase.dimensions,
            coordinateHint: `x maps to widthCm (${suitcase.dimensions.widthCm}cm total), y maps to lengthCm (${suitcase.dimensions.lengthCm}cm total)`,
        })),
        steps: semanticSteps.map((step) => ({
            itemId: step.itemId,
            suitcaseId: step.suitcaseId,
            placementZone: step.placementZone,
            itemDimensionsPacked: step.itemDimensionsPacked,
            description: step.description,
        })),
    }

    try {
        const result = await strategyModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: `${STRATEGY_STAGE_B_PROMPT}\n\nInput:\n${JSON.stringify(payload)}` }] }],
        })

        const rawText = result?.response?.text?.() ?? '{}'
        const { parsed } = safeParseModelJson(rawText, 'strategy stage B response')
        const generated = Array.isArray(parsed?.placements) ? parsed.placements : []

        if(generated.length) {
            candidatePlacements = generated
            stageBMeta = {
                source: 'ai',
                error: null,
            }
        } else {
            stageBMeta = {
                source: 'fallback',
                error: 'Stage B returned no placements.',
            }
        }
    } catch (error) {
        console.error('Failed Stage B layout generation. Using fallback.', error)
        stageBMeta = {
            source: 'fallback',
            error: error?.message ?? 'Unknown Stage B failure.',
        }
    }

    const normalized = resolvePlacementOverlaps(candidatePlacements)
    const byKey = new Map(normalized.map((placement) => [`${placement.itemId}:${placement.suitcaseId}`, placement]))

    return {
        steps: semanticSteps.map((step) => {
            const match = byKey.get(`${step.itemId}:${step.suitcaseId}`) ?? fallbackPlacements.find((placement) => placement.itemId === step.itemId && placement.suitcaseId === step.suitcaseId)
            const safe = normalizeBox(match)

            return {
                ...step,
                x0: safe.x0,
                x1: safe.x1,
                y0: safe.y0,
                y1: safe.y1,
            }
        }),
        meta: stageBMeta,
    }
}

const getStrategySteps = async ({ items = [], suitcases = [] }) => {
    const semantic = await getStrategySemanticSteps({ items, suitcases })
    return getStrategyLayoutSteps({ semanticSteps: semantic.steps, suitcases })
}

export {
    getPredictedItemMetrics,
    getPredictedSuitcaseFromImage,
    getPlanResultSummary,
    getStrategySemanticSteps,
    getStrategyLayoutSteps,
    getStrategySteps,
}