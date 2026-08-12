const FALLBACK_TRIP_THUMBNAIL = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80'

const getDestinationThumbnail = async ({ env, destination }) => {
    try {
        const params = new URLSearchParams({
            query: destination,
            orientation: 'landscape',
            per_page: '1',
        })
        const response = await fetch(`https://api.pexels.com/v1/search?${params}`, {
            headers: { Authorization: env.PEXELS_API_KEY },
        })

        if (!response.ok) {
            return { thumbnailUrl: FALLBACK_TRIP_THUMBNAIL, source: 'fallback' }
        }

        const data = await response.json()
        return {
            thumbnailUrl: data?.photos?.[0]?.src?.landscape ?? FALLBACK_TRIP_THUMBNAIL,
            source: data?.photos?.[0]?.src?.landscape ? 'pexels' : 'fallback',
        }
    } catch {
        return { thumbnailUrl: FALLBACK_TRIP_THUMBNAIL, source: 'fallback' }
    }
}

export { FALLBACK_TRIP_THUMBNAIL, getDestinationThumbnail }
