import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, CircleAlert, Sparkles } from 'lucide-react'
import Return from '@/components/common/Return'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import LoadingScreen from '@/components/common/LoadingScreen'
import ErrorScreen from '@/components/common/ErrorScreen'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripsContext'
import { useTripItems } from '../contexts/ItemsContext'
import { usePlans, useTripPlan } from '../contexts/PlansContext'
import { getTripById } from '../utils/tripUtils'
import { getTotalWeight } from '../utils/itemUtils'
import useWeightFormatter from '../hooks/useWeightFormatter'

const PlanOverview = () => {
    const { tripId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { trips, loading: tripsLoading, error: tripsError } = useTrips()
    const { items, loading: itemsLoading, error: itemsError } = useTripItems(tripId)
    const { plan, loading: planLoading, error: planError } = useTripPlan(tripId)
    const {
        generatingResult,
        generateResultError,
        generatingStrategy,
        generateStrategyError,
        generateResult,
        generateStrategy,
    } = usePlans()

    const [actionError, setActionError] = useState(null)
    const { formatWeight } = useWeightFormatter()

    const trip = useMemo(() => getTripById(trips, tripId), [trips, tripId])
    const planResult = plan?.result ?? null
    const totalWeight = useMemo(() => getTotalWeight(items), [items])
    const baggageLimit = Number(trip?.baggageLimit) || 0
    const isResultReady = Boolean(planResult)
    const isSuccess = Boolean(planResult?.success)
    const strategySteps = plan?.strategy?.steps ?? []
    const hasGeneratedStrategy = strategySteps.length > 0
    const strategyLoadingText = 'AI is planning your packing strategy...'
    const weightProgress = baggageLimit > 0 ? Math.min((totalWeight / baggageLimit) * 100, 100) : 0

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

    if (tripsLoading || itemsLoading) {
        return <LoadingScreen text='Preparing plan analysis...'/>
    }

    if (tripsError || itemsError || planError) {
        return (
            <ErrorScreen
                text={tripsError?.message ?? itemsError?.message ?? planError?.message ?? 'Failed to load plan.'}
            />
        )
    }

    if (!trip) {
        return <ErrorScreen text='Trip not found.'/>
    }

    if (items.length === 0) {
        return <Navigate to={`/trips/${tripId}`} replace />
    }

    if (generatingStrategy && !hasGeneratedStrategy) {
        return <LoadingScreen text={strategyLoadingText} />
    }

    const canGenerateStrategy = isSuccess && !hasGeneratedStrategy

    const handleGenerateStrategy = async () => {

        if (hasGeneratedStrategy) {
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
        <main className='min-h-full'>
            <div className='mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12'>
                <Return text='Back to trip' link={`/trips/${tripId}`} />

                <section className='flex flex-col gap-3 border-b pb-6'>
                    <Badge variant='secondary' className='w-fit'><Sparkles className='size-3.5' /> AI packing plan</Badge>
                    <div>
                        <h1 className='text-3xl font-semibold tracking-tight'>Packing analysis</h1>
                        <p className='mt-1 text-muted-foreground'>A practical check of your list for {trip.destination}.</p>
                    </div>
                </section>

                <div className='grid gap-6 lg:grid-cols-[0.85fr_1.15fr]'>
                    <Card>
                        <CardHeader>
                            <div className='flex items-start justify-between gap-4'>
                                <div>
                                    <CardDescription>Weight check</CardDescription>
                                    <CardTitle className='mt-1 text-2xl'>{!isResultReady ? 'Analyzing…' : isSuccess ? 'Within limit' : 'Over limit'}</CardTitle>
                                </div>
                                <div className={`rounded-full p-2 ${isResultReady && !isSuccess ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                    {isResultReady && !isSuccess ? <CircleAlert className='size-5' /> : <CheckCircle2 className='size-5' />}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                            <Progress value={weightProgress} />
                            <div className='flex justify-between text-sm'>
                                <span className='text-muted-foreground'>Packed</span>
                                <span className='font-medium'>{formatWeight(totalWeight, { decimals: 2 })} / {formatWeight(baggageLimit, { decimals: 2 })}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className='flex items-center gap-2'><Sparkles className='size-4 text-muted-foreground' /><CardTitle>Recommendation</CardTitle></div>
                            <CardDescription>Generated from your trip details and packing list.</CardDescription>
                        </CardHeader>
                        <CardContent><p className='leading-7 text-muted-foreground'>{planResult?.summary ?? 'Analyzing your packing list…'}</p></CardContent>
                    </Card>
                </div>

                {actionError || generateResultError || generateStrategyError ? (
                    <p className='text-sm text-destructive'>
                        {actionError?.message ?? generateResultError?.message ?? generateStrategyError?.message}
                    </p>
                ) : null}

                <Button
                    className='w-full sm:w-fit sm:self-end'
                    disabled={(!canGenerateStrategy && !hasGeneratedStrategy) || !planResult}
                    loading={!hasGeneratedStrategy && (generatingStrategy || generatingResult || planLoading)}
                    onClick={handleGenerateStrategy}
                >
                    {hasGeneratedStrategy ? 'View packing strategy' : 'Build packing strategy'} <ArrowRight className='size-4' />
                </Button>
            </div>
        </main>
    )
}

export default PlanOverview
