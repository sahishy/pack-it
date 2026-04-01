import config from '../config.js'

const FALLBACK_TRIP_THUMBNAIL = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80'

const getThumbnailUrl = async (destination) => {

    const apiKey = config.pexelsApiKey

    if(!apiKey || !destination) {
        return FALLBACK_TRIP_THUMBNAIL
    }

    try {

        const params = new URLSearchParams({
            query: destination,
            orientation: 'landscape',
            per_page: '1',
        })

        const response = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
            headers: {
                Authorization: apiKey,
            },
        })

        if (!response.ok) {
            return FALLBACK_TRIP_THUMBNAIL
        }

        const data = await response.json()
        const firstPhoto = data?.photos?.[0]

        return firstPhoto?.src?.landscape ?? FALLBACK_TRIP_THUMBNAIL

    } catch {
        return FALLBACK_TRIP_THUMBNAIL
    }
    
}

export {
    FALLBACK_TRIP_THUMBNAIL,
    getThumbnailUrl,
}
