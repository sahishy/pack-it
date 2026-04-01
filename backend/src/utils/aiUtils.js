import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAI, GoogleAIBackend, getGenerativeModel, Schema } from 'firebase/ai'

const STRATEGY_PROMPT = `
Create an ordered packing plan for one suitcase.

Return JSON matching the schema.

Goal:
- place heavier items at the bottom / wheel side
- cushion fragile items with soft items
- keep liquids upright and separated
- keep accessible items near the top or pockets
- group similar items
- use space efficiently
- use only provided items
- do not mention item IDs inside descriptions

Write concise, specific step descriptions that say where and how to pack each item.

Input:
- items: array of items
- suitcase: suitcase info
- rules: optional constraints
`

const WEIGHT_PROMPT = `
Estimate the weight in kilograms of the packable item in the provided input.

Return JSON only:
{"success": boolean, "weightKg": number}

Rules:
- success=true only for a real, logical, non-living, packable item.
- If the exact item is unknown but plausible, estimate from item type, brand, size, dimensions, and material.
- Unknown but reasonable product names should still succeed. Example: "MacBook Neo" -> true.
- Reject animals, people, living things, impossible/fantasy objects, nonsense, abstractions, or non-items. Example: "Dog" -> false.
- If success=false, weightKg=-1.
- Use kilograms only.
- No extra keys. No explanation.
`

const STRATEGY_SCHEMA = Schema.object({
    properties: {
        steps: Schema.array({
            items: Schema.object({
                properties: {
                    index: Schema.number(),
                    description: Schema.string(),
                    itemId: Schema.string(),
                },
            }),
        }),
    },
})

const WEIGHT_SCHEMA = Schema.object({
    properties: {
        success: Schema.boolean(),
        weightKg: Schema.number()
    }
})

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const ai = getAI(app, { backend: new GoogleAIBackend() })

const strategyModel = getGenerativeModel(ai, {
    model: 'gemini-2.5-flash-lite',
})
const weightModel = getGenerativeModel(ai, {
    model: 'gemini-2.5-flash-lite',
})


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

const normalizeWeightPrediction = (value) => {

    const success = value?.success
    const weightKg = Number(value?.weightKg)

    if(success === false) {
        return {
            success: false,
            weightKg: -1,
            reason: 'Item not recognized',
        }
    }

    if(success !== true) {
        return {
            success: false,
            weightKg: -1,
            reason: 'Server failure',
        }
    }

    if(!Number.isFinite(weightKg) || weightKg < 0) {
        return {
            success: false,
            weightKg: -1,
            reason: 'Server failure',
        }
    }

    return {
        success: true,
        weightKg: Number(weightKg.toFixed(2)),
        reason: '',
    }

}

const getPredictedItemWeight = async ({ name = '', category = '', quantity = 1 } = {}) => {
    const fallback = {
        success: false,
        weightKg: -1,
        reason: 'Server failure',
    }

    const payload = {
        item: {
            name: String(name ?? '').trim(),
            category: String(category ?? '').trim(),
            quantity: Number(quantity) || 1,
        },
    }

    const fullPrompt = `${WEIGHT_PROMPT}\n\nInput:\n${JSON.stringify(payload)}`
    const contents = [{
        role: 'user',
        parts: [{ text: fullPrompt }],
    }]

    try {
        const result = await weightModel.generateContent({
            contents,
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: WEIGHT_SCHEMA,
            },
        })

        const rawText = result?.response?.text?.() ?? '{}'
        const parsed = JSON.parse(rawText)
        return normalizeWeightPrediction(parsed)
    } catch (error) {
        console.error('Failed to predict item weight with Gemini. Falling back to failed response.', error)
        return fallback
    }
}

const getStrategySteps = async ({ items = [] }) => {

    if (!items.length) {
        return { steps: [] }
    }

    const fallback = { steps: buildFallbackSteps(items) }

    const strategyInput = {
        items: items.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            weight: item.weight,
            checked: item.checked,
        })),
        suitcase: {
            id: 'default_suitcase',
            name: 'Main suitcase',
            type: 'checked-bag',
        },
        rules: {
            outputLanguage: 'English',
        },
    }

    const fullPrompt = `${STRATEGY_PROMPT}\n\nInput:\n${JSON.stringify(strategyInput)}`
    const contents = [{
        role: 'user',
        parts: [{ text: fullPrompt }],
    }]

    try {
        const result = await strategyModel.generateContent({
            contents,
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: STRATEGY_SCHEMA,
            },
        })

        const rawText = result?.response?.text?.() ?? '{}'
        const parsed = JSON.parse(rawText)

        if (!Array.isArray(parsed?.steps)) {
            return fallback
        }

        return {
            steps: parsed.steps.map((step, index) => ({
                index: Number(step?.index) || index + 1,
                itemId: step?.itemId || fallback.steps[index]?.itemId || items[index]?.id || '',
                description: sanitizeDescription(
                    step?.description || fallback.steps[index]?.description || 'Pack this item carefully.',
                    step?.itemId || fallback.steps[index]?.itemId || items[index]?.id || '',
                ) || 'Pack this item carefully.',
            })),
        }
    } catch (error) {
        console.error('Failed to generate strategy with Gemini. Falling back to deterministic strategy.', error)
        return fallback
    }

}

export {
    getPredictedItemWeight,
    getPlanResultSummary,
    getStrategySteps,
}
