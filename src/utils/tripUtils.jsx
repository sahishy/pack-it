const FALLBACK_TRIP_THUMBNAIL = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80'

const getTotalTripsCount = (trips) => {
    return trips.length;
}

const getUpcomingTripsCount = (trips) => {
    const today = new Date()
    return trips.filter((trip) => new Date(trip.startDate) >= today).length
}

const getTripById = (trips, tripId) => {
    return trips.find((trip) => trip.id === tripId)
}

const getTripThumbnail = (trip) => {
    return trip?.thumbnailUrl || FALLBACK_TRIP_THUMBNAIL
}

export {
    FALLBACK_TRIP_THUMBNAIL,
    getTotalTripsCount,
    getUpcomingTripsCount,
    getTripById,
    getTripThumbnail,
}