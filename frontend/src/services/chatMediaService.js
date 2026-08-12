import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { workerPostFormData } from './workerClient'

const CHAT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const CHAT_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
const CHAT_IMAGE_ACCEPT = [...CHAT_IMAGE_TYPES, ...CHAT_IMAGE_EXTENSIONS].join(',')
const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024
const MAX_IMAGE_EDGE = 1280
const IMAGE_QUALITY = 0.72

const loadImage = (file) => new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
        URL.revokeObjectURL(url)
        resolve(image)
    }
    image.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('This image could not be read. Try a JPEG, PNG, WebP, or HEIC photo.'))
    }
    image.src = url
})

const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('This photo could not be prepared for sending.'))
    }, 'image/jpeg', IMAGE_QUALITY)
})

const prepareChatImage = async (file) => {
    const extension = `.${file?.name?.split('.').pop()?.toLowerCase()}`
    if (!file || (!CHAT_IMAGE_TYPES.includes(file.type.toLowerCase()) && !CHAT_IMAGE_EXTENSIONS.includes(extension))) {
        throw new Error('Choose a JPEG, PNG, WebP, or HEIC photo.')
    }
    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
        throw new Error('Choose a photo smaller than 20 MB.')
    }

    const image = await loadImage(file)
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { alpha: false })
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
    const blob = await canvasToBlob(canvas)

    return new File([blob], 'chat-photo.jpg', { type: 'image/jpeg' })
}

const dataUrlToFile = async (dataUrl) => {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    return new File([blob], 'camera-photo.jpg', { type: blob.type || 'image/jpeg' })
}

const takeNativeChatPhoto = async () => {
    if (!Capacitor.isNativePlatform()) return null

    const photo = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.DataUrl,
        quality: 72,
        width: MAX_IMAGE_EDGE,
        height: MAX_IMAGE_EDGE,
        correctOrientation: true,
        saveToGallery: false,
    })

    if (!photo.dataUrl) throw new Error('The camera did not return a photo.')
    return prepareChatImage(await dataUrlToFile(photo.dataUrl))
}

const transcribeChatAudio = async (audioBlob) => {
    const extension = audioBlob.type.includes('mp4') ? 'm4a' : audioBlob.type.includes('ogg') ? 'ogg' : 'webm'
    const formData = new FormData()
    formData.append('audio', new File([audioBlob], `voice-message.${extension}`, {
        type: audioBlob.type || 'audio/webm',
    }))
    return workerPostFormData('/v1/ai/transcribe', formData)
}

export {
    CHAT_IMAGE_ACCEPT,
    prepareChatImage,
    takeNativeChatPhoto,
    transcribeChatAudio,
}
