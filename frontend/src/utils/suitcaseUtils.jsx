const SUITCASE_CONFIDENCE_WARNING_THRESHOLD = 0.7
const BYTES_PER_MEGABYTE = 1024 * 1024
const SUITCASE_IMAGE_MAX_BYTES = 20 * BYTES_PER_MEGABYTE
const SUITCASE_IMAGE_TARGET_BYTES = 18 * BYTES_PER_MEGABYTE

const formatBytesToMb = (bytes = 0, decimals = 1) => {
    const numericBytes = Number(bytes)

    if(!Number.isFinite(numericBytes) || numericBytes <= 0) {
        return `0 MB`
    }

    return `${(numericBytes / BYTES_PER_MEGABYTE).toFixed(decimals)} MB`
}

const hasLowSuitcaseConfidence = (confidenceValue) => {
    const numericConfidence = Number(confidenceValue)

    if(!Number.isFinite(numericConfidence)) {
        return false
    }

    return numericConfidence < SUITCASE_CONFIDENCE_WARNING_THRESHOLD
}

const getDataUrlBase64Payload = (dataUrl = '') => {
    const serialized = String(dataUrl)
    return serialized.includes(',') ? serialized.split(',')[1] : serialized
}

const estimateBase64Bytes = (base64Value = '') => {
    const sanitized = String(base64Value).replace(/=+$/, '')
    return Math.floor((sanitized.length * 3) / 4)
}

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.readAsDataURL(file)
})

const loadImageElement = (dataUrl) => new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to process image.'))
    image.src = dataUrl
})

const getSafeImageMimeType = (mimeType = '') => {
    if(mimeType === 'image/png' || mimeType === 'image/webp' || mimeType === 'image/jpeg') {
        return mimeType
    }

    return 'image/jpeg'
}

const compressImageForUpload = async (
    file,
    {
        targetMaxBytes = SUITCASE_IMAGE_TARGET_BYTES,
        hardMaxBytes = SUITCASE_IMAGE_MAX_BYTES,
    } = {},
) => {
    const originalDataUrl = await readFileAsDataUrl(file)
    const originalBase64 = getDataUrlBase64Payload(originalDataUrl)
    const originalBytes = estimateBase64Bytes(originalBase64)

    if(originalBytes <= targetMaxBytes) {
        return {
            mimeType: getSafeImageMimeType(file?.type),
            imageBase64: originalBase64,
            originalBytes,
            optimizedBytes: originalBytes,
            wasCompressed: false,
        }
    }

    const image = await loadImageElement(originalDataUrl)
    const baseMimeType = getSafeImageMimeType(file?.type)
    const mimeCandidates = baseMimeType === 'image/png'
        ? ['image/webp', 'image/jpeg']
        : ['image/webp', 'image/jpeg', baseMimeType]

    const scaleCandidates = [1, 0.85, 0.7, 0.55]
    const qualityCandidates = [0.9, 0.75, 0.6, 0.45, 0.35]

    let bestResult = null

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if(!context) {
        throw new Error('Could not initialize image compression.')
    }

    for(const mimeType of mimeCandidates) {
        for(const scale of scaleCandidates) {
            const width = Math.max(1, Math.floor(image.width * scale))
            const height = Math.max(1, Math.floor(image.height * scale))
            canvas.width = width
            canvas.height = height
            context.clearRect(0, 0, width, height)
            context.drawImage(image, 0, 0, width, height)

            for(const quality of qualityCandidates) {
                const dataUrl = canvas.toDataURL(mimeType, quality)
                const imageBase64 = getDataUrlBase64Payload(dataUrl)
                const optimizedBytes = estimateBase64Bytes(imageBase64)

                if(!bestResult || optimizedBytes < bestResult.optimizedBytes) {
                    bestResult = {
                        mimeType,
                        imageBase64,
                        originalBytes,
                        optimizedBytes,
                        wasCompressed: true,
                    }
                }

                if(optimizedBytes <= targetMaxBytes) {
                    return {
                        mimeType,
                        imageBase64,
                        originalBytes,
                        optimizedBytes,
                        wasCompressed: true,
                    }
                }
            }
        }
    }

    if(bestResult && bestResult.optimizedBytes <= hardMaxBytes) {
        return bestResult
    }

    throw new Error('Could not optimize image enough. Try a different photo.')
}

export {
    SUITCASE_CONFIDENCE_WARNING_THRESHOLD,
    SUITCASE_IMAGE_MAX_BYTES,
    hasLowSuitcaseConfidence,
    estimateBase64Bytes,
    formatBytesToMb,
    compressImageForUpload,
}
