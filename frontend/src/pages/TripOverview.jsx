import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowUp, CalendarDays, Camera, Mic, PackageOpen, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { FaSuitcaseRolling } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { RadialProgress } from '@/components/ui/chart'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { removeItem, removeTripItems, updateItemChecked, updateItemManualMetrics } from '../services/itemService'
import { deleteTripPlan } from '../services/planService'
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
    const [showOverview, setShowOverview] = useState(false)
    const [activeSuitcaseIndex, setActiveSuitcaseIndex] = useState(0)
    const [chatDraft, setChatDraft] = useState('')
    const [hasSentMessage, setHasSentMessage] = useState(false)
    const [promptIndex, setPromptIndex] = useState(0)
    const [outgoingPromptIndex, setOutgoingPromptIndex] = useState(null)

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

    const trip = useMemo(() => getTripById(trips, tripId), [trips, tripId])
    const totalWeight = useMemo(() => getTotalWeight(items), [items])
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
    const weightProgress = baggageLimit > 0 ? Math.min((totalWeight / baggageLimit) * 100, 100) : 0
    const weightRemaining = Math.max(baggageLimit - totalWeight, 0)
    const resolvedSuitcaseIndex = Math.min(activeSuitcaseIndex, Math.max(suitcases.length - 1, 0))
    const activeSuitcase = suitcases[resolvedSuitcaseIndex]
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
            await removeItem(itemId)
            await deleteTripPlan(user.uid, tripId)
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
            await removeTripItems(user.uid, tripId)
            await deleteTripPlan(user.uid, tripId)
            await removeTrip(tripId)
            navigate('/home', { replace: true })
        } catch (errorValue) {
            setActionError(errorValue)
        }
    }

    const handleSaveItemMetrics = async (payload) => {
        if (!editingItem?.id) return
        try {
            setSavingEdit(true)
            setEditError(null)
            await updateItemManualMetrics(editingItem.id, payload)
            await deleteTripPlan(user.uid, tripId)
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

    const handleSendMessage = () => {
        if (!chatDraft.trim()) return
        setHasSentMessage(true)
        setChatDraft('')
    }

    const chatComposer = (
        <div className='absolute inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-10 mx-auto max-w-2xl sm:inset-x-6 sm:bottom-4'>
            <div className='mb-4 flex justify-center md:hidden'>
                <Button size='sm' className='rounded-full shadow-sm' onClick={() => setShowOverview(true)}>Overview</Button>
            </div>
            <div className='flex flex-col gap-1 p-2 bg-neutral4 rounded-xl'>
                <div className='relative'>
                    <Textarea value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder={hasSentMessage ? 'Message Pack-It' : ''} className='min-h-8 resize-none border-0 bg-transparent! px-2 py-2 shadow-none focus-visible:ring-0' />
                    {!hasSentMessage && !chatDraft ? (
                        <div aria-hidden='true' className='pointer-events-none absolute inset-x-2 top-2 h-6 overflow-hidden text-sm leading-6 text-muted-foreground'>
                            {outgoingPromptIndex !== null ? <span className='absolute inset-x-0 animate-[chat-prompt-out_280ms_ease-in_forwards] motion-reduce:animate-none'>{EMPTY_CHAT_PROMPTS[outgoingPromptIndex]}</span> : null}
                            <span key={promptIndex} className='absolute inset-x-0 animate-[chat-prompt-in_280ms_ease-out] motion-reduce:animate-none'>{EMPTY_CHAT_PROMPTS[promptIndex]}</span>
                        </div>
                    ) : null}
                </div>
                <div className='flex items-center justify-between px-1'>
                    <Button variant='ghost' size='icon' className='shrink-0' aria-label='Add photo'><Camera className='size-5' /></Button>
                    <div className='flex items-center gap-1'>
                        <Button variant='ghost' size='icon' className='shrink-0' aria-label='Use microphone'><Mic className='size-5' /></Button>
                        <Button size='icon' className='shrink-0 size-8' aria-label='Send message' onClick={handleSendMessage} disabled={!chatDraft.trim()}><ArrowUp className='size-4' /></Button>
                    </div>
                </div>
            </div>
        </div>
    )

    const chatPanel = (
        <section className='relative flex h-full min-h-0 flex-col bg-background'>
            <ScrollArea className='min-h-0 flex-1'>
                <div className='mx-auto flex min-h-full max-w-2xl -translate-y-8 flex-col items-center justify-center px-6 py-28 text-center sm:px-8 sm:py-32'>
                    <img src={PackItMark} alt='Pack-It' className='size-12 animate-[chat-empty-state-in_500ms_ease-out_both] object-contain motion-reduce:animate-none' />
                    <h2 className='mt-5 animate-[chat-empty-state-in_500ms_ease-out_80ms_both] text-xl font-semibold tracking-tight motion-reduce:animate-none'>What would you like to pack for {trip.destination}?</h2>
                    <p className='mt-2 max-w-md animate-[chat-empty-state-in_500ms_ease-out_160ms_both] text-sm leading-6 text-muted-foreground motion-reduce:animate-none'>Tell Pack-It what you have in mind, and it can help turn your ideas into a thoughtful packing list.</p>
                </div>
            </ScrollArea>
            {chatComposer}
        </section>
    )

    const overviewPanel = (
        <section className='relative flex h-full min-h-0 flex-col bg-muted/20'>
            <ScrollArea className='min-h-0 flex-1'>
                <div className='min-h-full p-4 pb-44 pt-28 sm:p-6 sm:pb-44 sm:pt-32'>
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
                            <div className='mb-3 flex justify-end'>
                                <Button size='icon' className='size-7' aria-label='Add item' onClick={() => handleOpenAddItem()}>
                                    <Plus className='size-3.5' />
                                </Button>
                            </div>
                            <div className='space-y-2'>
                                {orderedItems.map((item) => (
                                    <Item key={item.id} item={item} onToggleChecked={handleToggleChecked} onDelete={handleDeleteItem} onEdit={setEditingItem} isUpdating={updatingItemIds.has(item.id)} isDeleting={deletingItemIds.has(item.id)} />
                                ))}
                                {showAddForm ? <AddItemForm tripId={tripId} onCancel={() => setShowAddForm(false)} onSaved={() => setShowAddForm(false)} /> : null}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <Card className='absolute inset-x-5 bottom-8 z-10 mx-auto w-auto max-w-md gap-0 rounded-2xl border border-white/70 bg-background/95 p-0 shadow-[0_14px_36px_rgba(31,41,55,0.12),0_3px_10px_rgba(31,41,55,0.06)] ring-1 ring-foreground/5 backdrop-blur-md sm:inset-x-8 sm:bottom-10'>
                <CardContent className='space-y-3 px-5 py-4 sm:px-6'>
                    <div className='flex items-center justify-between gap-5'>
                        <div className='min-w-0'>
                            <p className='truncate font-semibold'>{activeSuitcase?.name || 'Any suitcase'}</p>
                            <p className='mt-0.5 text-xs text-muted-foreground'>{items.length} {items.length === 1 ? 'item' : 'items'}</p>
                        </div>
                        <div className='flex shrink-0 items-center gap-3'>
                            <div className='text-right'>
                                <p className='font-semibold tabular-nums'>{baggageLimit > 0 ? `${formatWeight(totalWeight, { decimals: 1 })} / ${formatWeight(baggageLimit, { decimals: 1 })}` : formatWeight(totalWeight, { decimals: 1 })}</p>
                                {baggageLimit > 0 ? <p className='mt-0.5 text-xs text-muted-foreground'>{formatWeight(weightRemaining, { decimals: 1 })} left</p> : null}
                            </div>
                            <RadialProgress value={weightProgress} label='Baggage capacity' />
                        </div>
                    </div>
                    {suitcases.length > 1 ? (
                        <div className='flex justify-center gap-2' role='tablist' aria-label='Suitcases'>
                            {suitcases.map((suitcase, index) => (
                                <button
                                    key={suitcase.id}
                                    type='button'
                                    role='tab'
                                    aria-label={`Show ${suitcase.name || `suitcase ${index + 1}`}`}
                                    aria-selected={index === resolvedSuitcaseIndex}
                                    onClick={() => setActiveSuitcaseIndex(index)}
                                    className={`size-2 rounded-full transition-colors ${index === resolvedSuitcaseIndex ? 'bg-neutral0' : 'bg-neutral2 hover:bg-neutral1'}`}
                                />
                            ))}
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </section>
    )

    return (
        <main className='relative flex h-full min-h-0 flex-col overflow-hidden'>
            <header className='absolute inset-x-0 top-0 z-20 flex h-[calc(7rem+env(safe-area-inset-top))] items-start justify-center pt-[calc(0.375rem+env(safe-area-inset-top))] sm:h-28 sm:pt-3' style={{ backgroundImage: 'linear-gradient(to bottom, color-mix(in oklch, var(--background) 52%, #00AEFF 48%) 0%, color-mix(in oklch, var(--background) 78%, #bfdeff 22%) 58%, transparent 100%)' }}>
                <img src={Cloud} alt='' aria-hidden='true' className='pointer-events-none absolute -left-12 -top-4 w-36 max-w-none rotate-[1deg] scale-x-[-1] opacity-80 sm:-left-8 sm:-top-3 sm:w-44' />
                <img src={Cloud} alt='' aria-hidden='true' className='pointer-events-none absolute -right-12 -top-3 w-36 max-w-none -rotate-[0.5deg] opacity-80 sm:-right-8 sm:-top-2 sm:w-44' />
                <img src={Cloud2} alt='' aria-hidden='true' className='pointer-events-none absolute left-[14%] top-6 w-32 max-w-none rotate-[1deg] scale-x-[-1] opacity-55 sm:left-[20%] sm:top-7 sm:w-40' />
                <img src={Cloud2} alt='' aria-hidden='true' className='pointer-events-none absolute right-[14%] top-7 w-32 max-w-none -rotate-[1deg] opacity-55 sm:right-[20%] sm:top-8 sm:w-40' />
                <Sheet>
                    <SheetTrigger render={<Button variant='ghost' className='h-auto! min-h-0 flex-col gap-0 rounded-full px-0 py-0 hover:bg-transparent! active:bg-transparent! aria-expanded:bg-transparent!' aria-label={`Open details for ${trip.destination}`} />}>
                        <img src={getTripThumbnail(trip)} alt='' className='size-14 rounded-full object-cover shadow-sm' />
                        <span className='-mt-2 inline-flex max-w-52 items-center gap-1.5 rounded-full border bg-background px-4 py-1.5 text-sm font-medium shadow-sm'>
                            <span className='truncate'>{trip.destination}</span>
                        </span>
                    </SheetTrigger>
                    <SheetContent side='right' className='w-full gap-0 overflow-hidden rounded-l-2xl p-0 sm:max-w-md'>
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
                                <Button variant='secondary' className='w-full' onClick={handleOpenPlanOverview} disabled={items.length === 0 || hasFailedWeight || planLoading}><Sparkles /> {plan ? 'View packing plan' : 'Plan packing'}</Button>
                            </div>
                        </div>
                        <SheetFooter className='border-t bg-background px-6 py-6'>
                            <Button className='w-full' onClick={() => navigate(`/trips/${tripId}/edit`)}><Pencil /> Edit trip</Button>
                            <div className='mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4'>
                                <p className='font-medium text-destructive'>Danger zone</p>
                                <p className='mt-1 text-xs text-muted-foreground'>Deleting this trip permanently removes its packing list and plan.</p>
                                <Button variant='destructive' className='mt-4 w-full' onClick={handleDeleteTrip} disabled={deleting}><Trash2 /> {deleting ? 'Deleting…' : 'Delete trip'}</Button>
                            </div>
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

            <EditItemModal open={Boolean(editingItem)} item={editingItem} onClose={() => { if (!savingEdit) { setEditingItem(null); setEditError(null) } }} onSubmit={handleSaveItemMetrics} saving={savingEdit} error={editError} />
            <NoSuitcaseModal open={showNoSuitcaseModal} onClose={() => setShowNoSuitcaseModal(false)} onAddSuitcase={() => navigate('/suitcases')} />
        </main>
    )
}

export default TripOverview
