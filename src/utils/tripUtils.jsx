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

const getTripDurationDays = (trip) => {
    const startDate = new Date(trip?.startDate)
    const endDate = new Date(trip?.endDate)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return 0
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24
    const dateDifference = endDate.getTime() - startDate.getTime()

    if (dateDifference < 0) {
        return 0
    }

    return Math.max(1, Math.ceil(dateDifference / millisecondsPerDay))
}

export {
    FALLBACK_TRIP_THUMBNAIL,
    getTotalTripsCount,
    getUpcomingTripsCount,
    getTripById,
    getTripThumbnail,
    getTripDurationDays,
}