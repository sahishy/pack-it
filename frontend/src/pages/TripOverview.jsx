import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { AlertCircle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarDays, Camera, CheckCircle2, ImageIcon, LoaderCircle, Mic, PackageOpen, Pencil, Plus, Square, Trash2, X } from 'lucide-react'
import { FaSuitcaseRolling } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import { Message, MessageContent } from '@/components/ui/message'
import ChatMarkdown from '@/components/chat/ChatMarkdown'
import { RadialProgress } from '@/components/ui/chart'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import Item from '../components/items/Item'
import ItemGhost from '../components/ghost/ItemGhost'
import AddItemForm from '../components/items/AddItemForm'
import EditItemModal from '../components/items/EditItemModal'
import NoSuitcaseModal from '../components/plans/NoSuitcaseModal'
import LoadingScreen from '@/components/common/LoadingScreen'
import ErrorScreen from '@/components/common/ErrorScreen'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripsContext'
import { useTripItems } from '../contexts/ItemsContext'
import { useTripPlan } from '../contexts/PlansContext'
import { useSuitcases } from '../contexts/SuitcasesContext'
import { removeItem, updateItemChecked, updateItemManualMetrics } from '../services/itemService'
import { sendChatMessage, subscribeToTripChatMessages } from '../services/chatService'
import { CHAT_IMAGE_ACCEPT, prepareChatImage, takeNativeChatPhoto, transcribeChatAudio } from '../services/chatMediaService.js'
import { getTripById, getTripThumbnail } from '../utils/tripUtils'
import { getAirlineDisplayById } from '../utils/airlineUtils'
import { formatDisplayDate } from '../utils/formatters'
import { getTotalWeight } from '../utils/itemUtils'
import useWeightFormatter from '../hooks/useWeightFormatter'
import { useIsMobile } from '@/hooks/use-mobile'
import PackItMark from '@/assets/logo_sm.png'
import Cloud from '@/assets/images/cloud.png'
import Cloud2 from '@/assets/images/cloud_2.png'

const getCreatedAtMs = (item) => {
    const createdAt = item?.createdAt
    if (!createdAt) return 0
    if (typeof createdAt?.toMillis === 'function') return createdAt.toMillis()
    if (createdAt instanceof Date) return createdAt.getTime()
    const parsed = new Date(createdAt).getTime()
    return Number.isNaN(parsed) ? 0 : parsed
}

const EMPTY_CHAT_PROMPTS = [
    'What’s the weather like?',
    'What should I pack?',
    'Add an item to my packing list',
    'Review my packing list',
]

const DELETE_CONFIRMATION_DELAY_MS = 3000
const MAX_VOICE_SECONDS = 60

const TripOverview = () => {
    const navigate = useNavigate()
    const { tripId } = useParams()
    const { user } = useAuth()
    const { trips, loading: tripsLoading, error: tripsError, removeTrip, deleting, deleteError } = useTrips()
    const { items, loading: itemsLoading, error: itemsError } = useTripItems(tripId)
    const { plan, loading: planLoading } = useTripPlan(tripId)
    const { suitcases, loading: suitcasesLoading } = useSuitcases()
    const { formatWeight } = useWeightFormatter()
    const isMobile = useIsMobile()
    const [showAddForm, setShowAddForm] = useState(false)
    const [addItemSuitcaseId, setAddItemSuitcaseId] = useState('')
    const [updatingItemIds, setUpdatingItemIds] = useState(new Set())
    const [deletingItemIds, setDeletingItemIds] = useState(new Set())
    const [editingItem, setEditingItem] = useState(null)
    const [savingEdit, setSavingEdit] = useState(false)
    const [editError, setEditError] = useState(null)
    const [actionError, setActionError] = useState(null)
    const [showNoSuitcaseModal, setShowNoSuitcaseModal] = useState(false)
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
    const [deleteUnlockProgress, setDeleteUnlockProgress] = useState(0)
    const [showOverview, setShowOverview] = useState(false)
    const [activeSuitcaseIndex, setActiveSuitcaseIndex] = useState(0)
    const [chatDraft, setChatDraft] = useState('')
    const [chatMessages, setChatMessages] = useState([])
    const [chatLoading, setChatLoading] = useState(true)
    const [chatSending, setChatSending] = useState(false)
    const [chatError, setChatError] = useState(null)
    const [chatImage, setChatImage] = useState(null)
    const [imagePreparing, setImagePreparing] = useState(false)
    const [recordingStarting, setRecordingStarting] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [, setRecordingSeconds] = useState(0)
    const [transcribing, setTranscribing] = useState(false)
    const [revealingMessageId, setRevealingMessageId] = useState(null)
    const [showScrollToLatest, setShowScrollToLatest] = useState(false)
    const [showChatScrollbar, setShowChatScrollbar] = useState(false)
    const [hasSentMessage, setHasSentMessage] = useState(false)
    const [promptIndex, setPromptIndex] = useState(0)
    const [outgoingPromptIndex, setOutgoingPromptIndex] = useState(null)
    const seenChatMessageIdsRef = useRef(new Set())
    const initializedChatTripRef = useRef(null)
    const chatViewportRef = useRef(null)
    const chatWasNearBottomRef = useRef(true)
    const shouldScrollChatToBottomRef = useRef(true)
    const hideChatScrollbarTimeoutRef = useRef(null)
    const suppressNextChatScrollbarRef = useRef(false)
    const optimisticChatMessagesRef = useRef(new Map())
    const imageInputRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const mediaStreamRef = useRef(null)
    const recordingChunksRef = useRef([])
    const recordingTimerRef = useRef(null)
    const recordingStartedAtRef = useRef(0)
    const discardRecordingRef = useRef(false)
    const weightCardTouchStartRef = useRef(null)
    const didSwipeWeightCardRef = useRef(false)
    const isNativePlatform = Capacitor.isNativePlatform()

    const updateChatScrollPosition = () => {
        const viewport = chatViewportRef.current
        if (!viewport) return

        const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
        const isNearBottom = distanceFromBottom <= 64
        chatWasNearBottomRef.current = isNearBottom
        setShowScrollToLatest(!isNearBottom)

        if (suppressNextChatScrollbarRef.current) {
            suppressNextChatScrollbarRef.current = false
            return
        }

        setShowChatScrollbar(true)
        window.clearTimeout(hideChatScrollbarTimeoutRef.current)
        hideChatScrollbarTimeoutRef.current = window.setTimeout(() => {
            setShowChatScrollbar(false)
        }, 700)
    }

    const scrollChatToBottom = (behavior = 'smooth') => {
        const viewport = chatViewportRef.current
        if (!viewport) return

        if (behavior === 'auto') suppressNextChatScrollbarRef.current = true
        viewport.scrollTo({ top: viewport.scrollHeight, behavior })
        chatWasNearBottomRef.current = true
        setShowScrollToLatest(false)
    }

    useEffect(() => {
        if (hasSentMessage) return undefined

        const interval = window.setInterval(() => {
            setOutgoingPromptIndex(promptIndex)
            setPromptIndex((promptIndex + 1) % EMPTY_CHAT_PROMPTS.length)
        }, 3200)

        return () => window.clearInterval(interval)
    }, [hasSentMessage, promptIndex])

    useEffect(() => {
        if (outgoingPromptIndex === null) return undefined

        const timeout = window.setTimeout(() => setOutgoingPromptIndex(null), 280)
        return () => window.clearTimeout(timeout)
    }, [outgoingPromptIndex])

    useEffect(() => () => {
        window.clearTimeout(hideChatScrollbarTimeoutRef.current)
        window.clearInterval(recordingTimerRef.current)
        discardRecordingRef.current = true
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    }, [])

    useEffect(() => () => {
        if (chatImage?.previewUrl) URL.revokeObjectURL(chatImage.previewUrl)
    }, [chatImage?.previewUrl])

    useEffect(() => {
        if (!showDeleteConfirmation) return undefined

        const startedAt = performance.now()
        let animationFrame

        const updateDeleteCooldown = (now) => {
            const progress = Math.min(((now - startedAt) / DELETE_CONFIRMATION_DELAY_MS) * 100, 100)
            setDeleteUnlockProgress(progress)
            if (progress < 100) animationFrame = window.requestAnimationFrame(updateDeleteCooldown)
        }

        animationFrame = window.requestAnimationFrame(updateDeleteCooldown)
        return () => window.cancelAnimationFrame(animationFrame)
    }, [showDeleteConfirmation])

    useEffect(() => {
        optimisticChatMessagesRef.current.clear()
    }, [tripId])

    useEffect(() => {
        return subscribeToTripChatMessages(user?.uid, tripId, (messages) => {
            const isInitialSnapshot = initializedChatTripRef.current !== tripId
            const newAssistantMessage = isInitialSnapshot
                ? null
                : messages.find((message) => message.role === 'assistant' && !seenChatMessageIdsRef.current.has(message.id))

            initializedChatTripRef.current = tripId
            shouldScrollChatToBottomRef.current = isInitialSnapshot || chatWasNearBottomRef.current
            const savedMessageIds = new Set(messages.map(({ id }) => id))
            savedMessageIds.forEach((id) => optimisticChatMessagesRef.current.delete(id))
            const optimisticMessages = [...optimisticChatMessagesRef.current.values()]
                .filter((optimisticMessage) => optimisticMessage.tripId === tripId && !savedMessageIds.has(optimisticMessage.id))
            const mergedMessages = [...messages, ...optimisticMessages]

            seenChatMessageIdsRef.current = new Set(mergedMessages.map(({ id }) => id))
            setChatMessages(mergedMessages)
            setChatLoading(false)
            setRevealingMessageId(newAssistantMessage?.id ?? null)
            if (messages.length) setHasSentMessage(true)
        }, (errorValue) => {
            setChatError(errorValue)
            setChatLoading(false)
        })
    }, [tripId, user?.uid])

    useLayoutEffect(() => {
        if (chatLoading || !shouldScrollChatToBottomRef.current) return undefined

        const frame = window.requestAnimationFrame(() => {
            scrollChatToBottom('auto')
            shouldScrollChatToBottomRef.current = false
        })

        return () => window.cancelAnimationFrame(frame)
    }, [chatLoading, chatMessages.length, chatSending, tripId])

    const trip = useMemo(() => getTripById(trips, tripId), [trips, tripId])
    const tripDisplayName = (trip?.name?.trim() || trip?.destination?.trim() || 'your trip')
        .split(',')[0]
        .trim()
    const orderedItems = useMemo(
        () => [...items].sort((a, b) => getCreatedAtMs(a) - getCreatedAtMs(b)),
        [items],
    )
    const suitcaseGroups = useMemo(() => {
        if (suitcases.length === 0) return []

        const plannedSuitcaseByItemId = new Map(
            (plan?.strategy?.steps ?? []).map((step) => [step.itemId, step.suitcaseId]),
        )
        const itemsBySuitcaseId = new Map(suitcases.map((suitcase) => [suitcase.id, []]))
        const fallbackSuitcaseId = suitcases[0]?.id

        orderedItems.forEach((item) => {
            const assignedSuitcaseId = item.suitcaseId || plannedSuitcaseByItemId.get(item.id)
            const resolvedSuitcaseId = itemsBySuitcaseId.has(assignedSuitcaseId)
                ? assignedSuitcaseId
                : fallbackSuitcaseId
            itemsBySuitcaseId.get(resolvedSuitcaseId)?.push(item)
        })

        return suitcases.map((suitcase) => ({
            suitcase,
            items: itemsBySuitcaseId.get(suitcase.id) ?? [],
        }))
    }, [orderedItems, plan?.strategy?.steps, suitcases])

    if (!user) return <Navigate to='/login' replace />
    if (tripsLoading) return <LoadingScreen text='Loading trip...' />
    if (tripsError) return <ErrorScreen text={tripsError?.message ?? 'Failed to load trip.'} />
    if (!trip) return <ErrorScreen text='Trip not found.' />

    const formattedStartDate = formatDisplayDate(trip.startDate)
    const formattedEndDate = formatDisplayDate(trip.endDate)
    const dateRangeLabel = trip.startDate && trip.endDate
        ? `${formattedStartDate} – ${formattedEndDate}`
        : trip.startDate ? `Starts ${formattedStartDate}` : trip.endDate ? `Ends ${formattedEndDate}` : 'Dates not set'
    const baggageLimit = Number(trip.baggageLimit ?? 0)
    const resolvedSuitcaseIndex = Math.min(activeSuitcaseIndex, Math.max(suitcases.length - 1, 0))
    const activeSuitcase = suitcases[resolvedSuitcaseIndex]
    const activeSuitcaseItems = suitcaseGroups[resolvedSuitcaseIndex]?.items ?? orderedItems
    const activeSuitcaseWeight = getTotalWeight(activeSuitcaseItems)
    const activeWeightProgress = baggageLimit > 0 ? Math.min((activeSuitcaseWeight / baggageLimit) * 100, 100) : 0
    const activeWeightRemaining = Math.max(baggageLimit - activeSuitcaseWeight, 0)
    const hasFailedWeight = items.some((item) => item?.weight?.success === false)
    const airlineName = getAirlineDisplayById(trip.airline)?.name

    const handleToggleChecked = async (itemId, checked) => {
        try {
            setActionError(null)
            setUpdatingItemIds((previous) => new Set(previous).add(itemId))
            await updateItemChecked(itemId, checked)
        } catch (errorValue) {
            setActionError(errorValue)
        } finally {
            setUpdatingItemIds((previous) => {
                const next = new Set(previous)
                next.delete(itemId)
                return next
            })
        }
    }

    const handleDeleteItem = async (itemId) => {
        try {
            setActionError(null)
            setDeletingItemIds((previous) => new Set(previous).add(itemId))
            await removeItem(user.uid, tripId, itemId)
        } catch (errorValue) {
            setActionError(errorValue)
        } finally {
            setDeletingItemIds((previous) => {
                const next = new Set(previous)
                next.delete(itemId)
                return next
            })
        }
    }

    const handleDeleteTrip = async () => {
        try {
            setActionError(null)
            await removeTrip(tripId)
            navigate('/home', { replace: true })
        } catch (errorValue) {
            setActionError(errorValue)
        }
    }

    const handleOpenDeleteConfirmation = () => {
        setActionError(null)
        setDeleteUnlockProgress(0)
        setShowDeleteConfirmation(true)
    }

    const handleWeightCardTouchStart = (event) => {
        const touch = event.touches[0]
        if (!touch) return

        didSwipeWeightCardRef.current = false
        weightCardTouchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleWeightCardTouchEnd = (event) => {
        const start = weightCardTouchStartRef.current
        const touch = event.changedTouches[0]
        weightCardTouchStartRef.current = null

        if (!start || !touch || suitcases.length <= 1) return

        const horizontalDistance = touch.clientX - start.x
        const verticalDistance = touch.clientY - start.y
        const isHorizontalSwipe = Math.abs(horizontalDistance) >= 40
            && Math.abs(horizontalDistance) > Math.abs(verticalDistance) * 1.25

        if (!isHorizontalSwipe) return

        didSwipeWeightCardRef.current = true
        setActiveSuitcaseIndex((currentIndex) => horizontalDistance < 0
            ? (currentIndex + 1) % suitcases.length
            : (currentIndex - 1 + suitcases.length) % suitcases.length)

        window.setTimeout(() => {
            didSwipeWeightCardRef.current = false
        }, 0)
    }

    const handleWeightCardClickCapture = (event) => {
        if (!didSwipeWeightCardRef.current) return
        event.preventDefault()
        event.stopPropagation()
    }

    const handleSaveItemMetrics = async (payload) => {
        if (!editingItem?.id) return
        try {
            setSavingEdit(true)
            setEditError(null)
            await updateItemManualMetrics(user.uid, tripId, editingItem.id, payload)
            setEditingItem(null)
        } catch (errorValue) {
            setEditError(errorValue)
        } finally {
            setSavingEdit(false)
        }
    }

    const handleOpenPlanOverview = () => {
        if (!suitcasesLoading && suitcases.length === 0) {
            setShowNoSuitcaseModal(true)
            return
        }
        navigate(`/trips/${tripId}/plan`)
    }

    const handleOpenAddItem = (suitcaseId = '') => {
        setAddItemSuitcaseId(suitcaseId)
        setShowAddForm(true)
    }

    const handleSendMessage = async () => {
        const message = chatDraft.trim()
        const image = chatImage?.file ?? null
        if ((!message && !image) || chatSending || recordingStarting || isRecording || transcribing || imagePreparing) return

        const messageId = crypto.randomUUID()
        const displayedMessage = message || 'Photo attached'
        const optimisticUserMessage = {
            id: messageId,
            userId: user.uid,
            tripId,
            role: 'user',
            content: displayedMessage,
            hasImage: Boolean(image),
            actions: [],
            createdAt: new Date(),
            optimistic: true,
        }

        setHasSentMessage(true)
        setChatDraft('')
        setChatError(null)
        setChatSending(true)
        shouldScrollChatToBottomRef.current = true
        optimisticChatMessagesRef.current.set(messageId, optimisticUserMessage)
        seenChatMessageIdsRef.current.add(messageId)
        setChatMessages((currentMessages) => [...currentMessages, optimisticUserMessage])

        try {
            const response = await sendChatMessage({ tripId, messageId, message, image })
            setChatImage(null)
            const assistantMessageId = `${messageId}_assistant`
            const optimisticAssistantMessage = {
                id: assistantMessageId,
                userId: user.uid,
                tripId,
                role: 'assistant',
                content: response.message,
                actions: response.actions ?? [],
                createdAt: new Date(),
                optimistic: true,
            }

            optimisticChatMessagesRef.current.set(assistantMessageId, optimisticAssistantMessage)
            seenChatMessageIdsRef.current.add(assistantMessageId)
            shouldScrollChatToBottomRef.current = chatWasNearBottomRef.current
            setChatMessages((currentMessages) => currentMessages.some(({ id }) => id === assistantMessageId)
                ? currentMessages
                : [...currentMessages, optimisticAssistantMessage])
            setRevealingMessageId(assistantMessageId)
        } catch (errorValue) {
            setChatDraft((current) => current || message)
            setChatError(errorValue)
        } finally {
            setChatSending(false)
        }
    }

    const handleChatKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void handleSendMessage()
        }
    }

    const handleSelectedImage = async (file) => {
        if (!file) return
        try {
            setImagePreparing(true)
            setChatError(null)
            const preparedFile = await prepareChatImage(file)
            setChatImage({ file: preparedFile, previewUrl: URL.createObjectURL(preparedFile) })
        } catch (errorValue) {
            setChatError(errorValue)
        } finally {
            setImagePreparing(false)
            if (imageInputRef.current) imageInputRef.current.value = ''
        }
    }

    const handlePhotoButton = async () => {
        if (!isNativePlatform) {
            imageInputRef.current?.click()
            return
        }

        try {
            setImagePreparing(true)
            setChatError(null)
            const preparedFile = await takeNativeChatPhoto()
            if (preparedFile) setChatImage({ file: preparedFile, previewUrl: URL.createObjectURL(preparedFile) })
        } catch (errorValue) {
            if (!/cancel/i.test(errorValue?.message ?? '')) setChatError(errorValue)
        } finally {
            setImagePreparing(false)
        }
    }

    const stopVoiceRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    }

    const discardVoiceRecording = () => {
        discardRecordingRef.current = true
        stopVoiceRecording()
    }

    const startVoiceRecording = async () => {
        try {
            if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
                throw new Error('Voice recording is not supported on this device.')
            }

            setChatError(null)
            setRecordingStarting(true)
            discardRecordingRef.current = false
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']
                .find((type) => MediaRecorder.isTypeSupported(type))
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
            mediaStreamRef.current = stream
            mediaRecorderRef.current = recorder
            recordingChunksRef.current = []
            recordingStartedAtRef.current = Date.now()
            setRecordingSeconds(0)
            setIsRecording(true)

            recorder.addEventListener('dataavailable', (event) => {
                if (event.data.size) recordingChunksRef.current.push(event.data)
            })
            recorder.addEventListener('stop', async () => {
                window.clearInterval(recordingTimerRef.current)
                stream.getTracks().forEach((track) => track.stop())
                mediaStreamRef.current = null
                mediaRecorderRef.current = null
                setIsRecording(false)
                if (discardRecordingRef.current) return

                const audio = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
                if (!audio.size) {
                    setChatError(new Error('No audio was recorded. Please try again.'))
                    return
                }

                try {
                    setTranscribing(true)
                    const result = await transcribeChatAudio(audio)
                    const transcript = result?.text?.trim()
                    if (!transcript) throw new Error('No speech was detected. Please try again.')
                    setChatDraft((current) => `${current.trim()}${current.trim() ? ' ' : ''}${transcript}`.slice(0, 2000))
                } catch (errorValue) {
                    setChatError(errorValue)
                } finally {
                    setTranscribing(false)
                }
            })

            recorder.start(250)
            setRecordingStarting(false)
            recordingTimerRef.current = window.setInterval(() => {
                const elapsed = Math.min(MAX_VOICE_SECONDS, Math.floor((Date.now() - recordingStartedAtRef.current) / 1000))
                setRecordingSeconds(elapsed)
                if (elapsed >= MAX_VOICE_SECONDS) stopVoiceRecording()
            }, 250)
        } catch (errorValue) {
            mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
            setRecordingStarting(false)
            setIsRecording(false)
            setChatError(new Error(errorValue?.name === 'NotAllowedError'
                ? 'Microphone access is needed to record a message.'
                : errorValue?.message || 'The microphone could not be started.'))
        }
    }

    const handleVoiceButton = () => {
        if (isRecording) stopVoiceRecording()
        else void startVoiceRecording()
    }

    const chatComposer = (
        <div className='absolute inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-10 mx-auto max-w-2xl sm:inset-x-6 sm:bottom-4'>
            <div className='mb-4 flex justify-center md:hidden'>
                <Button size='sm' className='rounded-full shadow-sm' onClick={() => setShowOverview(true)}>Overview</Button>
            </div>
            {showScrollToLatest ? (
                <div className='mb-3 flex justify-center'>
                    <Button variant='outline' size='icon-sm' className='bg-background shadow-sm' aria-label='Scroll to latest message' onClick={() => scrollChatToBottom()}>
                        <ArrowDown className='size-4' />
                    </Button>
                </div>
            ) : null}
            <div className='flex flex-col gap-1 p-2 bg-neutral4 rounded-xl'>
                {chatImage ? (
                    <div className='group relative m-1 size-16 overflow-visible rounded-lg'>
                        <img src={chatImage.previewUrl} alt='Photo attached' className='size-16 rounded-lg object-cover' />
                        <Button
                            variant='secondary'
                            size='icon-xs'
                            className='absolute -right-1.5 -top-1.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100'
                            aria-label='Remove photo'
                            onClick={() => setChatImage(null)}
                        >
                            <X className='size-3.5' />
                        </Button>
                    </div>
                ) : null}
                <div className='relative'>
                    <Textarea value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} onKeyDown={handleChatKeyDown} placeholder={hasSentMessage ? 'Message Pack-It' : ''} rows={1} maxLength={2000} disabled={chatSending || transcribing} className='max-h-32 min-h-8 resize-none border-0 bg-transparent! px-2 py-2 shadow-none focus-visible:ring-0' />
                    {!hasSentMessage && !chatDraft ? (
                        <div aria-hidden='true' className='pointer-events-none absolute inset-x-2 top-2 h-6 overflow-hidden text-sm leading-6 text-muted-foreground'>
                            {outgoingPromptIndex !== null ? <span className='absolute inset-x-0 animate-[chat-prompt-out_280ms_ease-in_forwards] motion-reduce:animate-none'>{EMPTY_CHAT_PROMPTS[outgoingPromptIndex]}</span> : null}
                            <span key={promptIndex} className='absolute inset-x-0 animate-[chat-prompt-in_280ms_ease-out] motion-reduce:animate-none'>{EMPTY_CHAT_PROMPTS[promptIndex]}</span>
                        </div>
                    ) : null}
                </div>
                <div className='flex items-center justify-between px-1'>
                    <input ref={imageInputRef} type='file' accept={CHAT_IMAGE_ACCEPT} className='hidden' onChange={(event) => void handleSelectedImage(event.target.files?.[0])} />
                    <Button
                        variant='ghost'
                        size='icon'
                        className='shrink-0'
                        aria-label={isRecording ? 'Discard voice recording' : isNativePlatform ? 'Take a photo' : 'Choose a photo'}
                        onClick={isRecording ? discardVoiceRecording : () => void handlePhotoButton()}
                        disabled={chatSending || imagePreparing || recordingStarting || transcribing}
                    >
                        {imagePreparing ? <LoaderCircle className='size-5 animate-spin' /> : isRecording ? <Trash2 className='size-5' /> : <Camera className='size-5' />}
                    </Button>
                    <div className='flex items-center gap-1'>
                        <Button variant='ghost' size='icon' className='shrink-0' aria-label={isRecording ? 'Stop recording' : 'Record a voice message'} onClick={handleVoiceButton} disabled={chatSending || recordingStarting || transcribing || imagePreparing}>
                            {recordingStarting || transcribing ? <LoaderCircle className='size-5 animate-spin' /> : isRecording ? <Square className='size-4 fill-current' /> : <Mic className='size-5' />}
                        </Button>
                        <Button size='icon' className='shrink-0 size-8' aria-label='Send message' onClick={() => void handleSendMessage()} disabled={(!chatDraft.trim() && !chatImage) || chatSending || recordingStarting || isRecording || transcribing || imagePreparing}><ArrowUp className='size-4' /></Button>
                    </div>
                </div>
            </div>
        </div>
    )

    const chatPanel = (
        <section className='relative flex h-full min-h-0 flex-col bg-background'>
            <ScrollArea
                className='min-h-0 flex-1'
                viewportRef={chatViewportRef}
                onViewportScroll={updateChatScrollPosition}
                scrollbarClassName={`transition-opacity duration-200 ${showChatScrollbar ? 'opacity-100' : 'opacity-0'}`}
            >
                {chatMessages.length === 0 && !chatSending && !chatLoading && !chatError ? (
                    <div className='mx-auto flex min-h-full max-w-2xl -translate-y-8 flex-col items-center justify-center px-6 py-28 text-center sm:px-8 sm:py-32'>
                        <img src={PackItMark} alt='Pack-It' className='size-12 animate-[chat-empty-state-in_500ms_ease-out_both] object-contain motion-reduce:animate-none' />
                        <h2 className='mt-5 animate-[chat-empty-state-in_500ms_ease-out_80ms_both] text-xl font-semibold tracking-tight motion-reduce:animate-none'>What would you like to pack for {tripDisplayName}?</h2>
                        <p className='mt-2 max-w-md animate-[chat-empty-state-in_500ms_ease-out_160ms_both] text-sm leading-6 text-muted-foreground motion-reduce:animate-none'>Ask a travel question or tell Pack-It what to add to your packing list.</p>
                    </div>
                ) : (
                    <div className='mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-48 pt-32 sm:px-6'>
                        {chatMessages.map((entry) => (
                            <div key={entry.id} className='space-y-3'>
                                <Message align={entry.role === 'user' ? 'end' : 'start'}>
                                    <MessageContent className={entry.role === 'user' ? 'w-fit! max-w-[85%] flex-none' : 'w-fit! max-w-[90%] flex-none'}>
                                        <div className={entry.role === 'user'
                                            ? 'rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-background'
                                            : 'rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-foreground'}>
                                            {entry.role === 'assistant' ? (
                                                <ChatMarkdown content={entry.content} animate={entry.id === revealingMessageId} />
                                            ) : (
                                                <div className='space-y-1.5'>
                                                    {entry.hasImage ? <p className='flex items-center gap-1.5 text-sm opacity-80'><ImageIcon className='size-4' /> Photo attached</p> : null}
                                                    {entry.content !== 'Photo attached' ? <p className='whitespace-pre-wrap leading-6'>{entry.content}</p> : null}
                                                </div>
                                            )}
                                        </div>
                                    </MessageContent>
                                </Message>
                                {(entry.actions ?? []).map((action) => (
                                    <Marker key={`${entry.id}-${action.itemId}`} role='status' className='py-2'>
                                        <MarkerIcon><CheckCircle2 /></MarkerIcon>
                                        <MarkerContent>{action.label}</MarkerContent>
                                    </Marker>
                                ))}
                            </div>
                        ))}
                        {chatSending ? (
                            <Marker role='status' className='py-2'>
                                <MarkerIcon><LoaderCircle className='animate-spin' /></MarkerIcon>
                                <MarkerContent>Thinking…</MarkerContent>
                            </Marker>
                        ) : null}
                        {chatLoading ? (
                            <Marker role='status' className='py-2'>
                                <MarkerIcon><LoaderCircle className='animate-spin' /></MarkerIcon>
                                <MarkerContent>Loading conversation…</MarkerContent>
                            </Marker>
                        ) : null}
                        {chatError ? (
                            <Marker role='status' className='py-2'>
                                <MarkerIcon><AlertCircle /></MarkerIcon>
                                <MarkerContent>{chatError.message || 'Pack-It could not respond. Try again.'}</MarkerContent>
                            </Marker>
                        ) : null}
                    </div>
                )}
            </ScrollArea>
            <div aria-hidden='true' className='pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[calc(1rem+env(safe-area-inset-bottom))] bg-background sm:h-4' />
            {chatComposer}
        </section>
    )

    const overviewPanel = (
        <section className='relative flex h-full min-h-0 flex-col bg-muted/20'>
            <ScrollArea className='min-h-0 flex-1'>
                <div className='min-h-full p-4 pb-64 pt-28 sm:p-6 sm:pb-64 sm:pt-32'>
                    {actionError || deleteError ? <p className='text-sm text-destructive'>{(actionError || deleteError)?.message}</p> : null}
                    {itemsLoading ? (
                        <div className='space-y-3'><ItemGhost /><ItemGhost /><ItemGhost /></div>
                    ) : itemsError ? (
                        <ErrorScreen text={itemsError.message ?? 'Failed to load items.'} />
                    ) : items.length === 0 && !showAddForm ? (
                        <div className='flex min-h-[calc(100svh-21rem)] -translate-y-20 flex-col items-center justify-center text-center sm:translate-y-0'>
                            <div className='flex size-12 items-center justify-center rounded-xl border bg-background shadow-xs'>
                                <PackageOpen className='size-6 text-muted-foreground' />
                            </div>
                            <h2 className='mt-4 font-medium'>No items yet</h2>
                            <p className='mt-1 max-w-xs text-sm text-muted-foreground'>Add an item to start building your packing list.</p>
                            <Button className='mt-4' size='sm' onClick={() => handleOpenAddItem(suitcases[0]?.id)}>Add item</Button>
                        </div>
                    ) : suitcases.length > 0 ? (
                        <div className='space-y-7'>
                            {suitcaseGroups.map(({ suitcase, items: suitcaseItems }, index) => (
                                <section key={suitcase.id}>
                                    <div className='flex items-center justify-between gap-3'>
                                        <div className='flex min-w-0 items-center gap-2.5'>
                                            <FaSuitcaseRolling className='size-4 shrink-0 text-muted-foreground' aria-hidden='true' />
                                            <h2 className='truncate text-sm font-medium text-muted-foreground'>{suitcase.name || `Suitcase ${index + 1}`}</h2>
                                        </div>
                                        <Button
                                            size='icon'
                                            className='size-7 shrink-0'
                                            aria-label={`Add item to ${suitcase.name || `suitcase ${index + 1}`}`}
                                            onClick={() => handleOpenAddItem(suitcase.id)}
                                        >
                                            <Plus className='size-3.5' />
                                        </Button>
                                    </div>
                                    <div className='ml-2 mt-3 border-l pl-5'>
                                        {suitcaseItems.length > 0 ? (
                                            <div className='space-y-2'>
                                                {suitcaseItems.map((item) => (
                                                    <Item key={item.id} item={item} onToggleChecked={handleToggleChecked} onDelete={handleDeleteItem} onEdit={setEditingItem} isUpdating={updatingItemIds.has(item.id)} isDeleting={deletingItemIds.has(item.id)} />
                                                ))}
                                            </div>
                                        ) : null}
                                        {showAddForm && addItemSuitcaseId === suitcase.id ? (
                                            <div className={suitcaseItems.length > 0 ? 'mt-2' : 'mt-1'}>
                                                <AddItemForm tripId={tripId} suitcaseId={suitcase.id} onCancel={() => setShowAddForm(false)} onSaved={() => setShowAddForm(false)} />
                                            </div>
                                        ) : null}
                                    </div>
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <div className='mb-3 flex items-center justify-between gap-3'>
                                <h2 className='text-sm font-medium text-muted-foreground'>Items</h2>
                                <Button size='icon' className='size-7' aria-label='Add item' onClick={() => handleOpenAddItem()}>
                                    <Plus className='size-3.5' />
                                </Button>
                            </div>
                            <div className='ml-2 space-y-2 border-l pl-5'>
                                {orderedItems.map((item) => (
                                    <Item key={item.id} item={item} onToggleChecked={handleToggleChecked} onDelete={handleDeleteItem} onEdit={setEditingItem} isUpdating={updatingItemIds.has(item.id)} isDeleting={deletingItemIds.has(item.id)} />
                                ))}
                                {showAddForm ? <AddItemForm tripId={tripId} onCancel={() => setShowAddForm(false)} onSaved={() => setShowAddForm(false)} /> : null}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className='absolute inset-x-5 bottom-8 z-10 mx-auto w-auto max-w-md sm:inset-x-8 sm:bottom-10'>
                <Card
                    className='min-w-0 flex-1 gap-0 rounded-2xl bg-background/95 p-0 shadow-[0_14px_36px_rgba(31,41,55,0.12),0_3px_10px_rgba(31,41,55,0.06)] ring-0 backdrop-blur-md'
                    style={isNativePlatform ? { touchAction: 'pan-y' } : undefined}
                    onTouchStart={isNativePlatform ? handleWeightCardTouchStart : undefined}
                    onTouchEnd={isNativePlatform ? handleWeightCardTouchEnd : undefined}
                    onTouchCancel={isNativePlatform ? () => { weightCardTouchStartRef.current = null } : undefined}
                    onClickCapture={isNativePlatform ? handleWeightCardClickCapture : undefined}
                >
                    <CardContent className='space-y-3 px-5 py-4 sm:px-6'>
                        <div className='flex items-center justify-between gap-5'>
                            <div className='min-w-0'>
                                <p className='truncate font-semibold'>{activeSuitcase?.name || 'Any suitcase'}</p>
                                <p className='mt-0.5 text-xs text-muted-foreground'>{activeSuitcaseItems.length} {activeSuitcaseItems.length === 1 ? 'item' : 'items'}</p>
                            </div>
                            <div className='flex shrink-0 items-center gap-3'>
                                <div className='text-right'>
                                    <p className='font-semibold tabular-nums'>{baggageLimit > 0 ? `${formatWeight(activeSuitcaseWeight, { decimals: 1 })} / ${formatWeight(baggageLimit, { decimals: 1 })}` : formatWeight(activeSuitcaseWeight, { decimals: 1 })}</p>
                                    {baggageLimit > 0 ? <p className='mt-0.5 text-xs text-muted-foreground'>{formatWeight(activeWeightRemaining, { decimals: 1 })} left</p> : null}
                                </div>
                                <RadialProgress value={activeWeightProgress} label='Baggage capacity' />
                            </div>
                        </div>
                        {suitcases.length > 1 ? (
                            <div className='flex justify-center gap-1.5' role='tablist' aria-label='Suitcases'>
                                {suitcases.map((suitcase, index) => (
                                    <button
                                        key={suitcase.id}
                                        type='button'
                                        role='tab'
                                        aria-label={`Show ${suitcase.name || `suitcase ${index + 1}`}`}
                                        aria-selected={index === resolvedSuitcaseIndex}
                                        onClick={() => setActiveSuitcaseIndex(index)}
                                        className={`size-1.5 rounded-full transition-colors ${index === resolvedSuitcaseIndex ? 'bg-neutral0' : 'bg-neutral2 hover:bg-neutral1'}`}
                                    />
                                ))}
                            </div>
                        ) : null}
                        <div className={`grid gap-2 ${suitcases.length <= 1 ? 'grid-cols-1' : 'grid-cols-[15fr_15fr_70fr]'}`} role='group' aria-label='Packing plan controls'>
                            {suitcases.length > 1 ? (
                                <>
                                    <Button
                                        variant='secondary'
                                        className='min-w-0 rounded-2xl! px-0'
                                        aria-label='Show previous suitcase'
                                        onClick={() => setActiveSuitcaseIndex((currentIndex) => (currentIndex - 1 + suitcases.length) % suitcases.length)}
                                        disabled={suitcases.length <= 1}
                                    >
                                        <ArrowLeft />
                                    </Button>
                                    <Button
                                        variant='secondary'
                                        className='min-w-0 rounded-2xl! px-0'
                                        aria-label='Show next suitcase'
                                        onClick={() => setActiveSuitcaseIndex((currentIndex) => (currentIndex + 1) % suitcases.length)}
                                        disabled={suitcases.length <= 1}
                                    >
                                        <ArrowRight />
                                    </Button>
                                </>
                            ) : null}
                            <Button
                                className='w-full min-w-0 rounded-2xl!'
                                onClick={handleOpenPlanOverview}
                                disabled={items.length === 0 || hasFailedWeight || planLoading}
                            >
                                {plan ? 'View plan' : 'Generate plan'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    )

    return (
        <main className='relative flex h-full min-h-0 flex-col overflow-hidden'>
            <header className='absolute inset-x-0 top-0 z-20 flex h-[calc(7rem+env(safe-area-inset-top))] items-start justify-center pt-[calc(0.375rem+env(safe-area-inset-top))] sm:h-28 sm:pt-3' style={{ backgroundImage: 'var(--trip-sky-gradient)' }}>
                <div aria-hidden='true' className='night-sky-stars pointer-events-none absolute inset-0' />
                <img src={Cloud} alt='' aria-hidden='true' className='pointer-events-none absolute -left-12 -top-4 w-36 max-w-none rotate-[1deg] scale-x-[-1] opacity-80 dark:opacity-[0.02] sm:-left-8 sm:-top-3 sm:w-44' />
                <img src={Cloud} alt='' aria-hidden='true' className='pointer-events-none absolute -right-12 -top-3 w-36 max-w-none -rotate-[0.5deg] opacity-80 dark:opacity-[0.02] sm:-right-8 sm:-top-2 sm:w-44' />
                <img src={Cloud2} alt='' aria-hidden='true' className='pointer-events-none absolute left-[14%] top-6 w-32 max-w-none rotate-[1deg] scale-x-[-1] opacity-55 dark:opacity-[0.02] sm:left-[20%] sm:top-7 sm:w-40' />
                <img src={Cloud2} alt='' aria-hidden='true' className='pointer-events-none absolute right-[14%] top-7 w-32 max-w-none -rotate-[1deg] opacity-55 dark:opacity-[0.02] sm:right-[20%] sm:top-8 sm:w-40' />
                <Sheet>
                    <SheetTrigger render={<Button variant='ghost' className='h-auto! min-h-0 flex-col gap-0 rounded-full px-0 py-0 hover:bg-transparent! active:bg-transparent! aria-expanded:bg-transparent!' aria-label={`Open details for ${trip.destination}`} />}>
                        <img src={getTripThumbnail(trip)} alt='' className='size-14 rounded-full object-cover shadow-sm' />
                        <span className='-mt-2 inline-flex max-w-52 items-center gap-1.5 rounded-full border bg-background px-4 py-1.5 text-sm font-medium shadow-sm'>
                            <span className='truncate'>{trip.destination}</span>
                        </span>
                    </SheetTrigger>
                    <SheetContent side='right' className='w-full gap-0 overflow-hidden rounded-l-2xl p-0 max-md:pt-[env(safe-area-inset-top)] max-md:[&>button]:top-[calc(env(safe-area-inset-top)+0.75rem)] sm:max-w-md'>
                        <div className='min-h-0 flex-1 overflow-y-auto'>
                            <div className='relative aspect-[16/9] p-2'>
                                <img src={getTripThumbnail(trip)} alt={`${trip.destination} thumbnail`} className='size-full rounded-xl object-cover' />
                                <div className='absolute inset-2 rounded-xl bg-[linear-gradient(to_top,rgba(0,0,0,0.45),transparent_55%)]' />
                            </div>
                            <SheetHeader className='px-6 pb-4 pt-6'>
                                <SheetTitle className='text-2xl'>{trip.destination}</SheetTitle>
                                <SheetDescription className='flex items-center gap-1.5'><CalendarDays className='size-4' />{dateRangeLabel}</SheetDescription>
                            </SheetHeader>
                            <div className='space-y-5 px-6 pb-6'>
                                <div className='grid grid-cols-2 gap-3 text-sm'>
                                    <div className='rounded-xl bg-muted/60 p-3'><p className='text-xs text-muted-foreground'>Items</p><p className='mt-1 font-semibold'>{items.length}</p></div>
                                    <div className='rounded-xl bg-muted/60 p-3'><p className='text-xs text-muted-foreground'>Weight limit</p><p className='mt-1 font-semibold'>{formatWeight(baggageLimit, { decimals: 1 })}</p></div>
                                </div>
                                <div className='space-y-3 border-y py-5 text-sm'>
                                    {trip.tripPurpose ? <div className='flex justify-between gap-4'><span className='text-muted-foreground'>Purpose</span><span className='text-right font-medium'>{trip.tripPurpose}</span></div> : null}
                                    {airlineName ? <div className='flex justify-between gap-4'><span className='text-muted-foreground'>Airline</span><span className='text-right font-medium'>{airlineName}</span></div> : null}
                                    {trip.flightClass ? <div className='flex justify-between gap-4'><span className='text-muted-foreground'>Cabin</span><span className='text-right font-medium'>{trip.flightClass}</span></div> : null}
                                </div>
                            </div>
                        </div>
                        <SheetFooter className='bg-background px-6 py-6'>
                            <Button className='w-full' onClick={() => navigate(`/trips/${tripId}/edit`)}><Pencil /> Edit trip</Button>
                            <Button variant='negative' className='w-full' onClick={handleOpenDeleteConfirmation} disabled={deleting}><Trash2 /> Delete trip</Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </header>

            {isMobile ? (
                <div className='min-h-0 flex-1'>{chatPanel}</div>
            ) : (
                <ResizablePanelGroup orientation='horizontal' className='min-h-0 flex-1'>
                    <ResizablePanel defaultSize={55} minSize={36}>{chatPanel}</ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={45} minSize={32}>{overviewPanel}</ResizablePanel>
                </ResizablePanelGroup>
            )}

            <Sheet open={showOverview} onOpenChange={setShowOverview}>
                <SheetContent side='bottom' className='data-[side=bottom]:h-[85svh] gap-0 overflow-hidden rounded-t-2xl p-0'>
                    <SheetHeader className='border-b px-5 py-4'>
                        <SheetTitle>Overview</SheetTitle>
                    </SheetHeader>
                    <div className='min-h-0 flex-1'>{overviewPanel}</div>
                </SheetContent>
            </Sheet>

            <Dialog open={showDeleteConfirmation} onOpenChange={(open) => { if (!deleting) setShowDeleteConfirmation(open) }}>
                <DialogContent className='gap-6 rounded-2xl! p-6 sm:max-w-lg'>
                    <DialogHeader className='gap-2 pr-8'>
                        <DialogTitle className='text-xl'>Delete this trip?</DialogTitle>
                        <DialogDescription className='max-w-md leading-6'>This permanently deletes {trip.destination}, its packing list, and its plan. This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    {actionError ? <p className='text-sm text-destructive'>{actionError.message}</p> : null}
                    <div className='grid grid-cols-2 gap-3'>
                        <Button className='w-full' variant='outline' onClick={() => setShowDeleteConfirmation(false)} disabled={deleting}>Cancel</Button>
                        <Button
                            variant='negative'
                            className={`w-full overflow-hidden bg-[#b83e5d]! bg-none! before:hidden! ${deleteUnlockProgress < 100 ? 'opacity-60 disabled:opacity-60' : 'opacity-100 disabled:opacity-100'}`}
                            onClick={handleDeleteTrip}
                            disabled={deleteUnlockProgress < 100 || deleting}
                        >
                            <span
                                aria-hidden='true'
                                className='absolute inset-0 z-0 origin-left bg-[linear-gradient(180deg,color-mix(in_oklch,var(--destructive),#ffa0b8_62%)_0%,color-mix(in_oklch,var(--destructive),#f45f82_70%)_52%,color-mix(in_oklch,var(--destructive),#dd4668_68%)_100%)]'
                                style={{ transform: `scaleX(${deleteUnlockProgress / 100})` }}
                            />
                            <Trash2 className='relative z-10' />
                            <span className='relative z-10' aria-live='polite'>{deleting ? 'Deleting…' : deleteUnlockProgress < 100 ? `Delete trip (${Math.max(1, Math.ceil((DELETE_CONFIRMATION_DELAY_MS * (1 - deleteUnlockProgress / 100)) / 1000))}s)` : 'Delete trip'}</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <EditItemModal open={Boolean(editingItem)} item={editingItem} onClose={() => { if (!savingEdit) { setEditingItem(null); setEditError(null) } }} onSubmit={handleSaveItemMetrics} saving={savingEdit} error={editError} />
            <NoSuitcaseModal open={showNoSuitcaseModal} onClose={() => setShowNoSuitcaseModal(false)} onAddSuitcase={() => navigate('/suitcases')} />
        </main>
    )
}

export default TripOverview
