import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Luggage, Package, Scale } from 'lucide-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import Return from '@/components/common/Return'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import LoadingScreen from '@/components/common/LoadingScreen'
import ErrorScreen from '@/components/common/ErrorScreen'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripsContext'
import { useTripPlan } from '../contexts/PlansContext'
import { useTripItems } from '../contexts/ItemsContext'
import { useSuitcases } from '../contexts/SuitcasesContext'
import { getTripById } from '../utils/tripUtils'
import { getCategoryEmoji, getTotalWeight } from '../utils/itemUtils'
import { setTripPackedStatus } from '../services/tripService'
import useWeightFormatter from '../hooks/useWeightFormatter'

const StrategyOverview = () => {
    const { tripId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { trips, loading: tripsLoading, error: tripsError } = useTrips()
    const { plan, loading: planLoading, error: planError } = useTripPlan(tripId)
    const { items, loading: itemsLoading, error: itemsError } = useTripItems(tripId)
    const { suitcases } = useSuitcases()
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const { formatWeight, formatDimensions } = useWeightFormatter()

    const trip = useMemo(() => getTripById(trips, tripId), [trips, tripId])
    const steps = plan?.strategy?.steps ?? []
    const totalSteps = steps.length
    const currentStep = steps[currentStepIndex] ?? null
    const currentItem = useMemo(() => items.find((item) => item.id === currentStep?.itemId) ?? null, [items, currentStep?.itemId])
    const currentSuitcase = useMemo(() => suitcases.find((suitcase) => suitcase.id === currentStep?.suitcaseId) ?? null, [suitcases, currentStep?.suitcaseId])
    const originalDimensions = currentStep?.itemDimensionsOriginal ?? currentItem?.dimensions
    const packedDimensions = currentStep?.itemDimensionsPacked ?? originalDimensions
    const hasAdjustment = currentStep?.packingAdjustment && currentStep.packingAdjustment !== 'none'
    const progressPercent = totalSteps > 0 ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) : 0
    const isFinalStep = totalSteps > 0 && currentStepIndex === totalSteps - 1
    const totalWeight = useMemo(() => getTotalWeight(items), [items])

    if (!user) return <Navigate to='/login' replace />
    if (tripsLoading || planLoading || itemsLoading) return <LoadingScreen text='Loading strategy...' />
    if (tripsError || planError || itemsError) return <ErrorScreen text={tripsError?.message ?? planError?.message ?? itemsError?.message ?? 'Failed to load strategy.'} />
    if (!trip) return <ErrorScreen text='Trip not found.' />

    if (totalSteps === 0) {
        return (
            <main className='mx-auto flex min-h-full w-full max-w-2xl flex-col gap-8 px-5 py-6 sm:px-8 sm:py-10'>
                <Return link={`/trips/${tripId}/plan`} />
                <div className='flex flex-1 flex-col items-center justify-center text-center'>
                    <div className='flex size-12 items-center justify-center rounded-2xl bg-muted'><Luggage className='size-5' /></div>
                    <h1 className='mt-5 text-2xl font-semibold tracking-tight'>No packing order yet</h1>
                    <p className='mt-2 max-w-sm text-muted-foreground'>Start with the quick trip analysis and we’ll build it for you.</p>
                    <Button className='mt-6' onClick={() => navigate(`/trips/${tripId}/plan`)}>Start analysis <ArrowRight /></Button>
                </div>
            </main>
        )
    }

    const handleNext = () => {
        if (isFinalStep) {
            void setTripPackedStatus(tripId, true)
            setIsCompleted(true)
            return
        }
        setCurrentStepIndex((previous) => Math.min(previous + 1, totalSteps - 1))
    }

    const handlePrevious = () => {
        setCurrentStepIndex((previous) => Math.max(previous - 1, 0))
    }

    if (isCompleted) {
        return (
            <main className='min-h-full bg-background'>
                <div className='mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center px-5 py-12 text-center sm:px-8'>
                    <DotLottieReact
                        className='size-60'
                        src='https://lottie.host/5469e68e-7a9c-4862-a9ab-2e21e55d33c9/CEjnkN5238.lottie'
                        autoplay
                    />
                    <p className='mt-8 text-sm font-medium text-muted-foreground'>All {totalSteps} steps complete</p>
                    <h1 className='mt-2 text-4xl font-semibold tracking-tight'>You’re packed.</h1>
                    <p className='mt-3 text-muted-foreground'>{trip.destination} is ready to go.</p>

                    <div className='mt-10 grid w-full grid-cols-2 gap-3'>
                        <SummaryMetric icon={<Package />} value={items.length} label='items' />
                        <SummaryMetric icon={<Scale />} value={formatWeight(totalWeight, { decimals: 1 })} label='packed' />
                    </div>

                    <Button className='mt-6 w-full rounded-2xl!' onClick={() => navigate(`/trips/${tripId}`)}>Done</Button>
                </div>
            </main>
        )
    }

    return (
        <main className='min-h-full bg-background'>
            <div className='mx-auto flex min-h-full w-full max-w-2xl flex-col px-5 pb-28 pt-6 sm:px-8 sm:pb-32 sm:pt-10'>
                <div className='flex items-center justify-between'>
                    <Return text='Back' link={`/trips/${tripId}/plan`} />
                    <span className='text-sm tabular-nums text-muted-foreground'>{currentStepIndex + 1} / {totalSteps}</span>
                </div>
                <Progress className='mt-6 h-1' value={progressPercent} />

                <div className='flex flex-1 flex-col justify-center py-10 sm:py-14'>
                    <div className='flex size-16 items-center justify-center rounded-3xl bg-muted text-3xl' aria-hidden='true'>
                        {getCategoryEmoji(currentItem?.category)}
                    </div>
                    <p className='mt-8 text-sm font-medium text-muted-foreground'>{currentSuitcase?.name ?? 'Main suitcase'}</p>
                    <h1 className='mt-2 text-3xl font-semibold tracking-tight capitalize sm:text-4xl'>{currentItem?.name ?? 'Selected item'}</h1>
                    <p className='mt-3 max-w-xl text-base leading-7 text-muted-foreground'>{currentStep.description}</p>

                    {hasAdjustment ? (
                        <div className='mt-10 rounded-3xl bg-muted/55 p-5 sm:p-6'>
                            <p className='font-semibold capitalize'>{currentStep.packingAdjustment}</p>
                            <p className='mt-1 text-sm leading-6 text-muted-foreground'>{currentStep.packingAdjustmentReason}</p>
                            <div className='mt-5 grid grid-cols-2 gap-2'>
                                <div className='min-w-0 rounded-2xl bg-background/80 p-3.5'>
                                    <p className='text-xs font-medium text-muted-foreground'>Original</p>
                                    <p className='mt-1 truncate text-sm font-medium'>{formatDimensions(originalDimensions, { decimals: 1 })}</p>
                                </div>
                                <div className='min-w-0 rounded-2xl bg-background/80 p-3.5'>
                                    <p className='text-xs font-medium capitalize text-muted-foreground'>{currentStep.packingAdjustment}</p>
                                    <p className='mt-1 truncate text-sm font-medium'>{formatDimensions(packedDimensions, { decimals: 1 })}</p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className='fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-12'>
                <Button
                    variant='secondary'
                    className='rounded-2xl! border-0! shadow-none!'
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                >
                    <ArrowLeft className='size-4' />
                    <span>Previous</span>
                </Button>
                <Button
                    className='rounded-2xl! px-5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.2),inset_0_-1px_0_rgb(0_0_0_/_0.2)]! hover:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.26),inset_0_-1px_0_rgb(0_0_0_/_0.18)]!'
                    onClick={handleNext}
                >
                    <span>{isFinalStep ? 'Finish packing' : 'Next step'}</span>
                    <ArrowRight className='size-4' />
                </Button>
            </div>
        </main>
    )
}

const SummaryMetric = ({ icon, value, label }) => (
    <div className='flex flex-col items-center gap-2 rounded-3xl bg-muted/55 px-4 py-6'>
        <span className='text-muted-foreground [&_svg]:size-4'>{icon}</span>
        <p className='text-xl font-semibold'>{value}</p>
        <p className='text-sm text-muted-foreground'>{label}</p>
    </div>
)

export default StrategyOverview
