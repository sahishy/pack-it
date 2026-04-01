const serializeValue = (value) => {
    if(value === null || value === undefined) {
        return value
    }

    if(typeof value?.toDate === 'function') {
        return value.toDate().toISOString()
    }

    if(Array.isArray(value)) {
        return value.map(serializeValue)
    }

    if(typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)]),
        )
    }

    return value
}

const serializeDoc = (docSnapshot) => ({
    id: docSnapshot.id,
    ...serializeValue(docSnapshot.data()),
})

export {
    serializeDoc,
}
