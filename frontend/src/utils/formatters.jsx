const toIsoDate = (dateValue) => {
    const year = dateValue.getFullYear()
    const month = String(dateValue.getMonth() + 1).padStart(2, '0')
    const day = String(dateValue.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const getDateFromValue = (value) => {
    if (!value) {
        return null
    }

    const parsed = new Date(`${value}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) {
        return null
    }

    return parsed
}

const formatDisplayDate = (value) => {
    const parsedDate = getDateFromValue(value)

    if (!parsedDate) {
        return value
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(parsedDate)
}

export {
    toIsoDate,
    getDateFromValue,
    formatDisplayDate,
}
