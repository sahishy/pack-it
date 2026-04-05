const toPositiveNumber = (value) => {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) && numericValue > 0
        ? Number(numericValue.toFixed(2))
        : null
}

const normalizeSuitcaseInput = (suitcaseData = {}) => {
    const name = String(suitcaseData?.name ?? '').trim()
    const lengthCm = toPositiveNumber(suitcaseData?.dimensions?.lengthCm)
    const widthCm = toPositiveNumber(suitcaseData?.dimensions?.widthCm)
    const heightCm = toPositiveNumber(suitcaseData?.dimensions?.heightCm)

    return {
        name,
        dimensions: {
            lengthCm,
            widthCm,
            heightCm,
        },
    }
}

const isValidSuitcasePayload = (payload = {}) => {
    const hasName = Boolean(payload?.name)
    const lengthCm = payload?.dimensions?.lengthCm
    const widthCm = payload?.dimensions?.widthCm
    const heightCm = payload?.dimensions?.heightCm

    return hasName
        && Number.isFinite(lengthCm)
        && Number.isFinite(widthCm)
        && Number.isFinite(heightCm)
        && lengthCm > 0
        && widthCm > 0
        && heightCm > 0
}

const buildSuitcasePayload = (uid, suitcaseData = {}, confidence = {}) => {
    const normalized = normalizeSuitcaseInput(suitcaseData)

    return {
        userId: uid,
        name: normalized.name,
        dimensions: normalized.dimensions,
        confidenceName: Number.isFinite(Number(confidence?.confidenceName))
            ? Number(Number(confidence.confidenceName).toFixed(2))
            : 1,
        confidenceDimensions: Number.isFinite(Number(confidence?.confidenceDimensions))
            ? Number(Number(confidence.confidenceDimensions).toFixed(2))
            : 1,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
}

export {
    normalizeSuitcaseInput,
    isValidSuitcasePayload,
    buildSuitcasePayload,
}
