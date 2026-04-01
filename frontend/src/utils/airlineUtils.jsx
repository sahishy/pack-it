import airlinesData from '../data/airlines.json'

const AIRLINES = airlinesData.map((airline) => ({
    id: airline.id,
    name: airline.name,
    logo: airline.logo,
}))

const AIRLINES_BY_ID = new Map(AIRLINES.map((airline) => [airline.id, airline]))

const normalizeText = (value) => {
    return String(value ?? '').trim().toLowerCase()
}

const getAllAirlines = () => {
    return AIRLINES
}

const getAirlineById = (id) => {
    if (!id) {
        return null
    }

    return AIRLINES_BY_ID.get(String(id).trim()) ?? null
}

const searchAirlines = (query) => {
    const normalizedQuery = normalizeText(query)

    if (!normalizedQuery) {
        return AIRLINES
    }

    return AIRLINES.filter((airline) => (
        normalizeText(airline.name).includes(normalizedQuery)
    ))
}

const getAirlineDisplayById = (value) => {
    if (!value) {
        return null
    }

    const trimmedValue = String(value).trim()
    const byId = getAirlineById(trimmedValue)

    if (byId) {
        return byId
    }

    const byName = AIRLINES.find((airline) => normalizeText(airline.name) === normalizeText(trimmedValue))
    if (byName) {
        return byName
    }

    return {
        id: trimmedValue,
        name: trimmedValue,
        logo: '',
    }
}

export {
    getAllAirlines,
    getAirlineById,
    searchAirlines,
    getAirlineDisplayById,
}
