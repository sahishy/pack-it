import countryPlugInfo from '../../data/countryPlugInfo.json'

const normalizeToArray = (value) => {
    if (Array.isArray(value)) {
        return value
    }

    if (value === null || value === undefined) {
        return []
    }

    return [value]
}

const normalizePlugRecord = (record) => {
    return {
        country: record?.country ?? '',
        plugTypes: normalizeToArray(record?.plug_type).map(String),
        voltage: normalizeToArray(record?.voltage).map(Number).filter(Number.isFinite),
        frequency: normalizeToArray(record?.frequency).map(Number).filter(Number.isFinite),
    }
}

const getPlugCountries = () => {
    return [...countryPlugInfo]
        .map(normalizePlugRecord)
        .sort((a, b) => a.country.localeCompare(b.country))
}

const searchPlugCountries = (query = '') => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
        return getPlugCountries()
    }

    return getPlugCountries().filter((record) => record.country.toLowerCase().includes(normalizedQuery))
}

const getPlugInfoByCountry = (countryName) => {
    if (!countryName) {
        return null
    }

    const normalizedCountryName = countryName.trim().toLowerCase()

    return getPlugCountries().find((record) => record.country.toLowerCase() === normalizedCountryName) ?? null
}

export {
    getPlugCountries,
    searchPlugCountries,
    getPlugInfoByCountry,
}