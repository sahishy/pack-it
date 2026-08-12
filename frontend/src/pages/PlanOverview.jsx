import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { FaSuitcaseRolling } from 'react-icons/fa6'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { Button } from '@/components/ui/button'
import LoadingScreen from '@/components/common/LoadingScreen'
import ErrorScreen from '@/components/common/ErrorScreen'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripsContext'
import { useTripItems } from '../contexts/ItemsContext'
import { usePlans, useTripPlan } from '../contexts/PlansContext'
import { useSuitcases } from '../contexts/SuitcasesContext'
import { getTripById } from '../utils/tripUtils'
import Logo from '@/assets/logo_sm_white.png'

const PLAN_GENERATION_MESSAGES = [
    'Finding the perfect spot for every item...',
    'Balancing your suitcases...',
    'Putting the bulky things in first...',
    'Keeping your essentials within easy reach...',
    'Turning your list into a smooth packing plan...',
    'Making room for the things that matter...',
]

const getCreatedAtMs = (item) => {
    const createdAt = item?.createdAt
    if (!createdAt) return 0
    if (typeof createdAt?.toMillis === 'function') return createdAt.toMillis()
    if (createdAt instanceof Date) return createdAt.getTime()
    const parsed = new Date(createdAt).getTime()
    return Number.isNaN(parsed) ? 0 : parsed
}

const PlanGenerationLoading = () => {
    const [messageIndex, setMessageIndex] = useState(0)
    const [outgoingMessageIndex, setOutgoingMessageIndex] = useState(null)

    useEffect(() => {
        const interval = window.setInterval(() => {
            setOutgoingMessageIndex(messageIndex)
            setMessageIndex((messageIndex + 1) % PLAN_GENERATION_MESSAGES.length)
        }, 2800)

        return () => window.clearInterval(interval)
    }, [messageIndex])

    useEffect(() => {
        if (outgoingMessageIndex === null) return undefined

        const timeout = window.setTimeout(() => setOutgoingMessageIndex(null), 280)
        return () => window.clearTimeout(timeout)
    }, [outgoingMessageIndex])

    return (
        <main className='flex min-h-full items-center justify-center bg-background px-6 py-12'>
            <div className='relative flex w-full max-w-md flex-col items-center text-center'>
                <div className=''>
                    <DotLottieReact
                        className='size-52 sm:size-60'
                        src='https://lottie.host/5ea1bb5d-9bf8-467f-b5f6-a00798899418/pD97QjyYot.lottie'
                        loop
                        autoplay
                    />
                    <img src={Logo} className='absolute top-[51.2%] left-1/2 -translate-1/2 w-9'/>
                </div>

                <div className='w-full absolute bottom-2'>
                    <div className='relative h-7 w-full overflow-hidden text-sm leading-7 text-muted-foreground' aria-live='polite'>
                        {outgoingMessageIndex !== null ? (
                            <span className='absolute inset-x-0 animate-[chat-prompt-out_280ms_ease-in_forwards] motion-reduce:animate-none'>
                                {PLAN_GENERATION_MESSAGES[outgoingMessageIndex]}
                            </span>
                        ) : null}
                        <span key={messageIndex} className='absolute inset-x-0 animate-[chat-prompt-in_280ms_ease-out] motion-reduce:animate-none'>
                            {PLAN_GENERATION_MESSAGES[messageIndex]}
                        </span>
                    </div>
                    <p className='mt-2 text-xs text-muted-foreground/70'>This may take a moment.</p>
                </div>

            </div>
        </main>
    )
}

const PlanOverview = () => {
    const { tripId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { trips, loading: tripsLoading, error: tripsError } = useTrips()
    const { items, loading: itemsLoading, error: itemsError } = useTripItems(tripId)
    const { plan, loading: planLoading, error: planError } = useTripPlan(tripId)
    const { suitcases, loading: suitcasesLoading, error: suitcasesError } = useSuitcases()
    const {
        generatingResult,
        generateResultError,
        generatingStrategy,
        generateStrategyError,
        generateResult,
        generateStrategy,
    } = usePlans()

    const [actionError, setActionError] = useState(null)

    const trip = useMemo(() => getTripById(trips, tripId), [trips, tripId])
    const planResult = plan?.result ?? null
    const isResultReady = Boolean(planResult)
    const isSuccess = Boolean(planResult?.success)
    const strategySteps = useMemo(() => plan?.strategy?.steps ?? [], [plan?.strategy?.steps])
    const hasGeneratedStrategy = strategySteps.length > 0
    const savedStrategyItemIds = plan?.strategyItemIds
    const newItemIds = useMemo(() => {
        if (!hasGeneratedStrategy) return new Set()
        const generatedItemIds = Array.isArray(savedStrategyItemIds)
            ? new Set(savedStrategyItemIds)
            : new Set(strategySteps.map((step) => step.itemId).filter(Boolean))
        return new Set(items.filter((item) => !generatedItemIds.has(item.id)).map((item) => item.id))
    }, [hasGeneratedStrategy, items, savedStrategyItemIds, strategySteps])
    const hasNewItems = newItemIds.size > 0
    const orderedItems = useMemo(
        () => [...items].sort((a, b) => getCreatedAtMs(a) - getCreatedAtMs(b)),
        [items],
    )
    const suitcaseGroups = useMemo(() => {
        if (suitcases.length === 0) {
            return [{ suitcase: null, items: orderedItems }]
        }

        const plannedSuitcaseByItemId = new Map(
            strategySteps.map((step) => [step.itemId, step.suitcaseId]),
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

        return suitcases
            .map((suitcase) => ({ suitcase, items: itemsBySuitcaseId.get(suitcase.id) ?? [] }))
            .filter(({ items: suitcaseItems }) => suitcaseItems.length > 0)
    }, [orderedItems, strategySteps, suitcases])

    useEffect(() => {
        if (!trip || itemsLoading || planLoading || planResult || generatingResult) {
            return
        }

        const syncPlanResult = async () => {
            try {
                setActionError(null)
                await generateResult(trip, items)
            } catch (errorValue) {
                setActionError(errorValue)
            }
        }

        syncPlanResult()
    }, [trip, items, itemsLoading, planLoading, planResult, generatingResult, generateResult])

    if (!user) {
        return <Navigate to='/login' replace />
    }

    if (tripsLoading || itemsLoading || suitcasesLoading) {
        return <LoadingScreen text='Preparing plan analysis...'/>
    }

    if (tripsError || itemsError || planError || suitcasesError) {
        return (
            <ErrorScreen
                text={tripsError?.message ?? itemsError?.message ?? planError?.message ?? suitcasesError?.message ?? 'Failed to load plan.'}
            />
        )
    }

    if (!trip) {
        return <ErrorScreen text='Trip not found.'/>
    }

    if (items.length === 0) {
        return <Navigate to={`/trips/${tripId}`} replace />
    }

    if (generatingStrategy) {
        return <PlanGenerationLoading />
    }

    const canGenerateStrategy = isSuccess && (!hasGeneratedStrategy || hasNewItems)

    const handleGenerateStrategy = async () => {
        if (hasGeneratedStrategy && !hasNewItems) {
            navigate(`/trips/${tripId}/plan/strategy`)
            return
        }

        if (!canGenerateStrategy) {
            return
        }

        try {
            setActionError(null)
            await generateStrategy(tripId, items)
            navigate(`/trips/${tripId}/plan/strategy`)
        } catch (errorValue) {
            setActionError(errorValue)
        }
        
    }

    return (
        <main className='min-h-full bg-background'>
            <div className='mx-auto flex min-h-full w-full max-w-2xl flex-col px-5 pb-32 pt-10 sm:px-8 sm:pb-36 sm:pt-14'>
                <div className='flex flex-1 flex-col'>
                    <p className='text-sm font-medium text-muted-foreground'>AI packing plan</p>
                    <h1 className='mt-2 text-3xl font-semibold tracking-tight sm:text-4xl'>Review your packing list</h1>
                    <p className='mt-3 max-w-xl text-base leading-7 text-muted-foreground'>
                        {hasNewItems
                            ? `${newItemIds.size} new ${newItemIds.size === 1 ? 'item was' : 'items were'} added. Regenerate your plan to include ${newItemIds.size === 1 ? 'it' : 'them'}.`
                            : hasGeneratedStrategy
                                ? 'Your packing plan is ready when you are.'
                                : 'Check what will be included before creating your packing order.'}
                    </p>

                    <div className='mt-10 space-y-8'>
                        {suitcaseGroups.map(({ suitcase, items: suitcaseItems }, index) => (
                            <section key={suitcase?.id ?? 'packing-list'}>
                                <div className='flex min-w-0 items-center gap-2.5'>
                                    <FaSuitcaseRolling className='size-4 shrink-0 text-muted-foreground' aria-hidden='true' />
                                    <h2 className='truncate text-sm font-medium text-muted-foreground'>
                                        {suitcase?.name || (suitcases.length > 0 ? `Suitcase ${index + 1}` : 'Packing list')}
                                    </h2>
                                    <span className='text-xs text-muted-foreground/70'>{suitcaseItems.length}</span>
                                </div>
                                <div className='ml-2 mt-3 space-y-2 border-l pl-5'>
                                    {suitcaseItems.map((item) => (
                                        <div key={item.id} className='flex min-h-12 items-center justify-between gap-4 rounded-xl bg-muted/50 px-4 py-3'>
                                            <div className='flex min-w-0 items-center gap-2'>
                                                <p className='truncate text-sm font-medium'>{item.name}</p>
                                                {newItemIds.has(item.id) ? (
                                                    <span className='shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary'>New</span>
                                                ) : null}
                                            </div>
                                            <span className='shrink-0 text-sm font-medium tabular-nums text-muted-foreground'>×{Number(item.quantity) || 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    {actionError || generateResultError || generateStrategyError ? (
                        <p className='mt-4 text-sm text-destructive'>
                            {actionError?.message ?? generateResultError?.message ?? generateStrategyError?.message}
                        </p>
                    ) : null}

                    {isResultReady && !isSuccess ? <p className='mt-3 text-center text-sm text-muted-foreground'>{planResult?.summary ?? 'Remove a few items, then try again.'}</p> : null}
                </div>
            </div>

            <div className='fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-12'>
                <Button
                    variant='secondary'
                    className='rounded-2xl! border-0! shadow-none!'
                    aria-label='Back to trip'
                    onClick={() => navigate(`/trips/${tripId}`)}
                >
                    <ArrowLeft className='size-4' />
                    <span>Back</span>
                </Button>
                {hasGeneratedStrategy && hasNewItems ? (
                    <Button
                        variant='secondary'
                        className='rounded-2xl! border-0! shadow-none!'
                        onClick={() => navigate(`/trips/${tripId}/plan/strategy`)}
                    >
                        View old plan
                    </Button>
                ) : null}
                <Button
                    className='rounded-2xl! px-5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.2),inset_0_-1px_0_rgb(0_0_0_/_0.2)]! hover:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.26),inset_0_-1px_0_rgb(0_0_0_/_0.18)]!'
                    disabled={(!canGenerateStrategy && (!hasGeneratedStrategy || hasNewItems)) || !planResult}
                    loading={generatingStrategy || generatingResult || planLoading}
                    onClick={handleGenerateStrategy}
                >
                    <span>{hasNewItems ? 'Regenerate plan' : hasGeneratedStrategy ? 'Continue packing' : 'Generate packing plan'}</span>
                </Button>
            </div>
        </main>
    )
}

export default PlanOverview
