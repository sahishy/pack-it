import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAI, GoogleAIBackend, getGenerativeModel, Schema } from 'firebase/ai'

const PROMPT = `
You are a smart packing planner.

Your task is to generate a step-by-step packing plan for items going into a single suitcase.

You must return JSON only. Do not include markdown. Do not include explanations. Do not include any text before or after the JSON.

Each element in the plan must be an object with exactly these fields:
- "index": integer
- "description": string
- "itemId": string

Output rules:
- "index" is the step number, starting at 1 and increasing by 1 for each step.
- "description" explains exactly how and where to pack the item inside the suitcase.
- "itemId" must exactly match an item id from the input.
- Return one object per packing action.
- Do not output extra keys.
- Do not output null values.
- Return valid JSON that can be parsed directly.

Packing behavior:
- Pack heavy items at the bottom of the suitcase.
- Pack heavy items near the wheel side or base when relevant.
- Pack fragile items surrounded or cushioned by soft items.
- Pack liquids upright, sealed, and separated inside a toiletry bag when possible.
- Pack frequently needed items in easy-access areas such as the top layer or suitcase pockets.
- Group similar items together when practical.
- Use space efficiently.
- Respect item constraints and suitcase constraints provided in the input.
- Do not invent items or details that are not present in the input.

Description rules:
- Be concise but specific.
- Mention the placement inside the suitcase, such as bottom layer, center, side edge, top layer, inner pocket, mesh compartment, shoe bag, or toiletry pouch.
- When helpful, mention preparation steps such as rolling, folding, wrapping, or placing inside another item.
- Never include any item id (for example item_01, uuid-style ids, or any raw id token) inside the "description" text.
- Do not explain your reasoning outside the description.

You will receive input in this shape:
- "items": array of item objects
- "suitcase": one suitcase object
- "rules": optional preferences and constraints

Useful item fields may include:
- id
- name
- category
- quantity
- weight
- dimensions
- fragility
- compressible
- liquid
- mustBeAccessible
- packingNotes

Useful suitcase fields may include:
- id
- name
- type
- capacity
- compartments
- weightLimit
- notes

Your job is to convert the input into an ordered packing plan.

Important: return an object with this shape:
{
  "steps": [
    {
      "index": 1,
      "description": "...",
      "itemId": "item_01"
    }
  ]
}
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

const sanitizeDescription = (description = '', itemId = '') => {
    const descriptionText = String(description ?? '')

    if (!descriptionText) {
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

const getStrategySteps = async ({ items = [] }) => {

    if(!items.length) {
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

    const fullPrompt = `${PROMPT}\n\nInput:\n${JSON.stringify(strategyInput)}`
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
    getPlanResultSummary,
    getStrategySteps,
}
