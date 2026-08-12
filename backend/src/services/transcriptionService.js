import OpenAI, { toFile } from 'openai'

const TRANSCRIPTION_MODEL = 'whisper-1'

const transcribeAudio = async ({ env, audioBytes, mimeType, filename }) => {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
    const transcription = await client.audio.transcriptions.create({
        file: await toFile(Buffer.from(audioBytes), filename, { type: mimeType }),
        model: TRANSCRIPTION_MODEL,
        response_format: 'json',
        temperature: 0,
        prompt: 'Travel, packing, suitcase, itinerary, destination, restaurant, hotel, airline.',
    })

    return {
        text: transcription.text?.trim() ?? '',
        meta: { provider: 'openai', model: TRANSCRIPTION_MODEL, source: 'ai' },
    }
}

export { transcribeAudio }
