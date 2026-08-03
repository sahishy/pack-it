import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Box, Check, CheckCircle2, Cuboid, Home, MapPin, Package, Scale } from 'lucide-react'
import Return from '@/components/common/Return'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import LoadingScreen from '@/components/common/LoadingScreen'
import ErrorScreen from '@/components/common/ErrorScreen'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripsContext'
import { useTripPlan } from '../contexts/PlansContext'
import { useTripItems } from '../contexts/ItemsContext'
import { useSuitcases } from '../contexts/SuitcasesContext'
import { getTripById } from '../utils/tripUtils'
import { getCategoryEmoji, getResolvedItemWeightKg, getTotalWeight, ITEM_CATEGORY_CONFIG } from '../utils/itemUtils'
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
    const baggageLimit = Number(trip?.baggageLimit ?? trip?.maxWeight ?? 0)
    const groupedItems = useMemo(() => {
        const grouped = items.reduce((result, item) => {
            const category = item?.category || 'Other'
            result[category] = [...(result[category] ?? []), item]
            return result
        }, {})
        const configured = ITEM_CATEGORY_CONFIG.map((category) => category.name)
        const order = [...configured.filter((category) => grouped[category]), ...Object.keys(grouped).filter((category) => !configured.includes(category)).sort()]
        return order.map((category) => ({ category, items: grouped[category] }))
    }, [items])

    if (!user) return <Navigate to='/login' replace />
    if (tripsLoading || planLoading || itemsLoading) return <LoadingScreen text='Loading strategy...' />
    if (tripsError || planError || itemsError) return <ErrorScreen text={tripsError?.message ?? planError?.message ?? itemsError?.message ?? 'Failed to load strategy.'} />
    if (!trip) return <ErrorScreen text='Trip not found.' />

    if (totalSteps === 0) {
        return (
            <main className='mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12'>
                <Return link={`/trips/${tripId}/plan`} />
                <Card><CardHeader><CardTitle>No strategy yet</CardTitle><CardDescription>Generate a packing strategy from the analysis page first.</CardDescription></CardHeader><CardContent><Button onClick={() => navigate(`/trips/${tripId}/plan`)}>Back to analysis</Button></CardContent></Card>
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

    if (isCompleted) {
        return (
            <main className='mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12'>
                <section className='rounded-2xl border bg-muted/30 p-8 text-center sm:p-12'>
                    <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600'><CheckCircle2 /></div>
                    <h1 className='text-3xl font-semibold tracking-tight'>Your trip is packed</h1>
                    <p className='mt-2 text-muted-foreground'>{trip.destination} is ready to go.</p>
                </section>

                <div className='grid gap-4 sm:grid-cols-3'>
                    <SummaryMetric icon={<MapPin />} value={trip.destination} label='Destination' />
                    <SummaryMetric icon={<Package />} value={items.length} label='Items packed' />
                    <SummaryMetric icon={<Scale />} value={formatWeight(totalWeight, { decimals: 2 })} label={`of ${formatWeight(baggageLimit, { decimals: 2 })}`} />
                </div>

                <Card>
                    <CardHeader><CardTitle>Final packing list</CardTitle><CardDescription>Everything included in this packing session.</CardDescription></CardHeader>
                    <CardContent className='space-y-6'>
                        {groupedItems.map((group) => (
                            <section key={group.category}>
                                <h3 className='mb-2 text-sm font-medium'>{getCategoryEmoji(group.category)} {group.category} <span className='font-normal text-muted-foreground'>· {group.items.length}</span></h3>
                                <div className='divide-y rounded-xl border'>
                                    {group.items.map((item) => (
                                        <div key={item.id} className='flex items-center justify-between gap-4 px-4 py-3 text-sm'>
                                            <span className='inline-flex items-center gap-2 font-medium'><Check className='size-4 text-emerald-600' />{item.name}</span>
                                            <span className='text-muted-foreground'>{formatWeight(getResolvedItemWeightKg(item.weight), { decimals: 2 })}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </CardContent>
                </Card>

                <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
                    <Button variant='outline' onClick={() => navigate(`/trips/${tripId}`)}>Back to trip</Button>
                    <Button onClick={() => navigate('/home')}><Home className='size-4' /> Return home</Button>
                </div>
            </main>
        )
    }

    return (
        <main className='mx-auto flex min-h-full w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12'>
            <Return link={`/trips/${tripId}/plan`} />
            <section>
                <div className='mb-3 flex items-center justify-between text-sm'><span className='font-medium'>Step {currentStepIndex + 1} of {totalSteps}</span><span className='text-muted-foreground'>{progressPercent}% complete</span></div>
                <Progress value={progressPercent} />
            </section>

            <div className='grid flex-1 gap-6 lg:grid-cols-[1.45fr_0.75fr]'>
                <Card className='min-h-[30rem] overflow-hidden p-0'>
                    <CardHeader className='border-b'>
                        <div className='flex items-center justify-between gap-3'><Badge variant='secondary'>Placement preview</Badge><Badge variant='outline'>Coming soon</Badge></div>
                        <CardTitle className='mt-2'>Where this item goes</CardTitle>
                        <CardDescription>{currentStep.description}</CardDescription>
                    </CardHeader>
                    <CardContent className='flex min-h-[24rem] items-center justify-center bg-muted/20 p-6'>
                        <div className='flex h-full min-h-80 w-full flex-col items-center justify-center rounded-xl border border-dashed bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:28px_28px] text-center'>
                            <div className='rounded-2xl border bg-background p-4 shadow-sm'><Cuboid className='size-8 text-muted-foreground' /></div>
                            <p className='mt-4 font-medium'>2D / 3D packing visualization</p>
                            <p className='mt-1 max-w-sm px-6 text-sm text-muted-foreground'>An interactive placement guide will show the item’s exact position and orientation here.</p>
                        </div>
                    </CardContent>
                </Card>

                <div className='flex flex-col gap-4'>
                    <Card>
                        <CardHeader><CardDescription>Currently packing</CardDescription><CardTitle>{currentItem?.name ?? 'Selected item'}</CardTitle></CardHeader>
                        <CardContent className='space-y-3 text-sm'>
                            <DetailRow label='Item size' value={formatDimensions(originalDimensions, { decimals: 1 })} />
                            {hasAdjustment ? <DetailRow label={`Packed ${currentStep.packingAdjustment}`} value={formatDimensions(packedDimensions, { decimals: 1 })} /> : null}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardDescription>Target suitcase</CardDescription><CardTitle className='flex items-center gap-2'><Box className='size-4' />{currentSuitcase?.name ?? 'Main suitcase'}</CardTitle></CardHeader>
                        <CardContent><DetailRow label='Suitcase size' value={formatDimensions(currentSuitcase?.dimensions, { decimals: 1 })} /></CardContent>
                    </Card>
                    <Button className='mt-auto w-full' size='lg' onClick={handleNext}>{isFinalStep ? 'Finish packing' : 'Next step'} <ArrowRight className='size-4' /></Button>
                </div>
            </div>
        </main>
    )
}

const DetailRow = ({ label, value }) => <div className='flex items-start justify-between gap-4'><span className='text-muted-foreground'>{label}</span><span className='text-right font-medium'>{value}</span></div>

const SummaryMetric = ({ icon, value, label }) => (
    <Card><CardContent className='flex items-center gap-3 p-0'><span className='text-muted-foreground'>{icon}</span><div><p className='font-semibold'>{value}</p><p className='text-sm text-muted-foreground'>{label}</p></div></CardContent></Card>
)

export default StrategyOverview
