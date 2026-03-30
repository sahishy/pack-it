import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BsStars } from 'react-icons/bs'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'
import Topbar from '../components/ui/Topbar'
import Return from '../components/ui/Return'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import LoadingScreen from '../components/ui/LoadingScreen'
import ErrorScreen from '../components/ui/ErrorScreen'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripsContext'
import { useTripItems } from '../contexts/ItemsContext'
import { usePlans, useTripPlan } from '../contexts/PlansContext'
import { getTripById } from '../utils/tripUtils'
import { getTotalWeight } from '../utils/itemUtils'

const PlanOverview = () => {
    const { tripId } = useParams()
    const navigate = useNavigate()
    const { user, profile, logout } = useAuth()
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

    const trip = useMemo(() => getTripById(trips, tripId), [trips, tripId])
    const planResult = plan?.result ?? null
    const totalWeight = useMemo(() => getTotalWeight(items), [items])
    const baggageLimit = Number(trip?.baggageLimit) || 0
    const displayName = profile?.firstName ? `${profile.firstName} ${profile?.lastName ?? ''}`.trim() : user?.email
    const isResultReady = Boolean(planResult)
    const isSuccess = Boolean(planResult?.success)
    const strategySteps = plan?.strategy?.steps ?? []
    const hasGeneratedStrategy = strategySteps.length > 0

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
        <main className='min-h-screen'>
            <Topbar displayName={displayName} email={user.email} onLogout={logout} />
            <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10'>
                <Return text='Back to trip' link={`/trips/${tripId}`} />

                <section className='flex flex-col items-center gap-3 text-center'>
                    <div className='rounded-full bg-linear-to-t from-primary0 to-primary1 p-4'>
                        <BsStars className='text-2xl text-neutral5' />
                    </div>
                    <h1 className='text-2xl font-semibold text-neutral0'>AI Packing Analysis</h1>
                    <p className='text-sm text-neutral1'>Smart recommendations for your {trip.destination} trip</p>
                </section>

                <Card
                    className={`flex items-center gap-4 border ${
                        !isResultReady
                            ? 'border-neutral2 bg-neutral5'
                            : isSuccess
                                ? 'border-positive1/30 bg-positive1/10'
                                : 'border-negative1/30 bg-negative1/10'
                    }`}
                >
                    {!isResultReady ? (
                        <BsStars className='text-4xl text-primary0' />
                    ) : isSuccess ? (
                        <FiCheckCircle className='text-4xl text-positive1' />
                    ) : (
                        <FiXCircle className='text-4xl text-negative1' />
                    )}

                    <div className='flex flex-col gap-1'>
                        <p
                            className={`text-2xl font-semibold ${
                                !isResultReady ? 'text-neutral0' : isSuccess ? 'text-positive0' : 'text-negative0'
                            }`}
                        >
                            {!isResultReady ? 'Analyzing...' : isSuccess ? 'Within Limit' : 'Over Limit'}
                        </p>
                        <p className={`text-sm ${!isResultReady ? 'text-neutral1' : isSuccess ? 'text-positive1' : 'text-negative1'}`}>
                            Current weight: {totalWeight.toFixed(1)} kg / {baggageLimit.toFixed(1)} kg limit
                        </p>
                    </div>
                </Card>

                <Card className='flex flex-col gap-3'>
                    <h2 className='text-xl font-semibold text-neutral0'>AI Recommendations</h2>
                    <p className='text-sm text-neutral1'>
                        {planResult?.summary ?? 'Analyzing your packing list...'}
                    </p>
                </Card>

                {actionError || generateResultError || generateStrategyError ? (
                    <p className='text-sm text-negative1'>
                        {actionError?.message ?? generateResultError?.message ?? generateStrategyError?.message}
                    </p>
                ) : null}

                <Button
                    className='w-full py-3'
                    disabled={(!canGenerateStrategy && !hasGeneratedStrategy) || !planResult}
                    loading={!hasGeneratedStrategy && (generatingStrategy || generatingResult || planLoading)}
                    onClick={handleGenerateStrategy}
                >
                    {hasGeneratedStrategy ? 'View Packing Strategy' : 'Get Packing Strategy'} <span className='ml-3'>→</span>
                </Button>
            </div>
        </main>
    )
}

export default PlanOverview