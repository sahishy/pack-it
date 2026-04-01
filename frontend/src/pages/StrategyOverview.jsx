import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { FaLocationDot, FaScaleBalanced, FaCircleCheck, FaHouse, FaRegCalendar } from 'react-icons/fa6'
import { FiPackage, FiCheckCircle } from 'react-icons/fi'
import Topbar from '../components/ui/Topbar'
import Return from '../components/ui/Return'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import LoadingScreen from '../components/ui/LoadingScreen'
import ErrorScreen from '../components/ui/ErrorScreen'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripsContext'
import { useTripPlan } from '../contexts/PlansContext'
import { useTripItems } from '../contexts/ItemsContext'
import { getTripById, getTripDurationDays } from '../utils/tripUtils'
import { getCategoryEmoji, getTotalWeight, ITEM_CATEGORY_CONFIG } from '../utils/itemUtils'
import { TbConfettiFilled } from 'react-icons/tb'
import { HiOutlineLocationMarker } from 'react-icons/hi'
import { setTripPackedStatus } from '../services/tripService'
import useWeightFormatter from '../hooks/useWeightFormatter'

const StrategyOverview = () => {

    const { tripId } = useParams()
    const navigate = useNavigate()
    const { user, profile, logout } = useAuth()
    const { trips, loading: tripsLoading, error: tripsError } = useTrips()
    const { plan, loading: planLoading, error: planError } = useTripPlan(tripId)
    const { items, loading: itemsLoading, error: itemsError } = useTripItems(tripId)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const { formatWeight } = useWeightFormatter()

    const trip = useMemo(() => getTripById(trips, tripId), [trips, tripId])
    const steps = plan?.strategy?.steps ?? []
    const totalSteps = steps.length
    const currentStep = steps[currentStepIndex] ?? null
    const progressPercent = totalSteps > 0 ? Math.round(((currentStepIndex) / totalSteps) * 100) : 0
    const isFinalStep = totalSteps > 0 && currentStepIndex === totalSteps - 1
    const displayName = profile?.firstName ? `${profile.firstName} ${profile?.lastName ?? ''}`.trim() : user?.email
    const tripDurationDays = getTripDurationDays(trip)
    const totalWeight = useMemo(() => getTotalWeight(items), [items])
    const baggageLimit = Number(trip?.baggageLimit ?? trip?.maxWeight ?? 0)
    const groupedItems = useMemo(() => {
        const grouped = items.reduce((accumulator, item) => {
            const category = item?.category || 'Other'
            if (!accumulator[category]) {
                accumulator[category] = []
            }

            accumulator[category].push(item)
            return accumulator
        }, {})

        const configuredOrder = ITEM_CATEGORY_CONFIG.map((categoryConfig) => categoryConfig.name)
        const orderedCategories = [
            ...configuredOrder.filter((categoryName) => grouped[categoryName]),
            ...Object.keys(grouped).filter((categoryName) => !configuredOrder.includes(categoryName)).sort(),
        ]

        return orderedCategories.map((categoryName) => ({
            category: categoryName,
            items: grouped[categoryName],
        }))
    }, [items])

    if (!user) {
        return <Navigate to='/login' replace />
    }

    if (tripsLoading || planLoading || itemsLoading) {
        return <LoadingScreen text='Loading strategy...' />
    }

    if (tripsError || planError || itemsError) {
        return <ErrorScreen text={tripsError?.message ?? planError?.message ?? itemsError?.message ?? 'Failed to load strategy.'} />
    }

    if (!trip) {
        return <ErrorScreen text='Trip not found.' />
    }

    if (totalSteps === 0) {
        return (
            <main className='min-h-screen bg-neutral5'>
                <Topbar displayName={displayName} email={user.email} onLogout={logout} />

                <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10'>
                    <Return link={`/trips/${tripId}/plan`} />
                    <Card className='flex flex-col gap-4'>
                        <h1 className='text-2xl font-semibold text-neutral0'>No strategy steps yet</h1>
                        <p className='text-neutral1'>Generate your packing strategy from the plan page first.</p>
                        <Button className='w-fit' onClick={() => navigate(`/trips/${tripId}/plan`)}>
                            Back to Plan
                        </Button>
                    </Card>
                </div>
            </main>
        )
    }

    const handleNext = () => {
        if(isFinalStep) {
            void setTripPackedStatus(tripId, true)
            setIsCompleted(true)
            return
        }

        setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1))
    }

    if (isCompleted) {
        return (
            <main className='min-h-screen'>
                <Topbar displayName={displayName} email={user.email} onLogout={logout} />

                <div className='mx-auto flex w-full max-w-4xl flex-col gap-5 px-6 py-10'>
                    <section className='flex flex-col items-center gap-3 text-center'>
                        <div className='flex h-20 w-20 items-center justify-center rounded-full bg-positive1 text-neutral5'>
                            <FiCheckCircle className='text-4xl' />
                        </div>
                        <div>
                            <h1 className='text-3xl font-semibold text-neutral0'>All Set!</h1>
                            <p className='text-neutral1'>Your {trip.destination} trip is ready</p>                            
                        </div>
                    </section>

                    <Card className='grid grid-cols-1 gap-4 p-5 md:grid-cols-4'>
                        <SummaryMetric icon={<HiOutlineLocationMarker className='text-3xl text-blue-500' />} value={trip.destination} label='Destination' />
                        <SummaryMetric
                            icon={<FaRegCalendar className='text-3xl text-violet-500' />}
                            value={`${tripDurationDays} ${tripDurationDays === 1 ? 'day' : 'days'}`}
                            label='Duration'
                        />
                        <SummaryMetric icon={<FiPackage className='text-3xl text-orange-500' />} value={items.length} label='Items' />
                        <SummaryMetric icon={<FaScaleBalanced className='text-3xl text-positive1' />} value={formatWeight(totalWeight, { decimals: 2 })} label='Total Weight' />
                    </Card>

                    <Card className='border border-positive1/40 bg-positive1/10 p-5'>
                        <div className='flex items-center gap-4'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-positive1 text-neutral5'>
                                <FiCheckCircle className='text-2xl' />
                            </div>
                            <div>
                                <h2 className='text-xl font-semibold text-positive0'>
                                    Perfect! Within baggage limit
                                </h2>
                                <p className='text-sm text-positive0/80'>
                                    {formatWeight(totalWeight, { decimals: 2 })} / {formatWeight(baggageLimit, { decimals: 2 })}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className='flex flex-col gap-5 p-5'>
                        <h2 className='text-2xl font-semibold text-neutral0'>Final Packing List</h2>

                        {groupedItems.map((group) => (
                            <div key={group.category} className='flex flex-col gap-3'>
                                <h3 className='text-lg font-semibold text-neutral0'>
                                    {getCategoryEmoji(group.category)} {group.category}{' '}
                                    <span className='text-sm font-normal text-neutral1'>({group.items.length} {group.items.length === 1 ? 'Item' : 'Items'})</span>
                                </h3>

                                <div className='flex flex-col gap-2'>
                                    {group.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className='flex items-center justify-between rounded-xl border border-neutral3 bg-neutral5 px-4 py-3'
                                        >
                                            <p className='flex items-center gap-3 text-base font-medium text-neutral0'>
                                                <FaCircleCheck className='text-positive1' />
                                                {item.name}
                                            </p>
                                            <p className='text-sm font-medium text-neutral1'>{formatWeight(item.weight ?? 0, { decimals: 2 })}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </Card>

                    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                        <Button variant='secondary' className='w-full py-3' onClick={() => navigate(`/trips/${tripId}`)}>
                            Edit Trip
                        </Button>
                        <Button className='flex w-full items-center gap-2 py-3' onClick={() => navigate('/home')}>
                            <FaHouse /> Return Home
                        </Button>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className='min-h-screen'>
            <Topbar displayName={displayName} email={user.email} onLogout={logout} />

            <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10'>
                <Return link={`/trips/${tripId}/plan`} />

                <section className='flex items-center justify-between'>
                    <p className='text-base text-neutral0/80'>Step {currentStepIndex + 1} of {totalSteps}</p>
                    <p className='text-base text-neutral0/80'>{progressPercent}% Complete</p>
                </section>

                <div className='h-3 w-full rounded-full bg-neutral3'>
                    <div
                        className='h-full rounded-full bg-linear-to-r from-primary0 to-primary1 transition-all'
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <Card className='flex min-h-80 flex-col items-center justify-center gap-5 text-center'>
                    <div className='flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-r from-primary0 to-primary1'>
                        <span className='text-2xl font-semibold text-white'>{currentStep.index}</span>
                    </div>

                    <p className='max-w-2xl text-lg text-neutral0/80'>{currentStep.description}</p>

                    <Button className='w-full flex gap-3' onClick={handleNext}>
                        {isFinalStep ? (
                            <>
                                <TbConfettiFilled /> Finish & View Summary
                            </>
                        ) : (
                            'Next Step'
                        )}
                    </Button>
                </Card>
            </div>
        </main>
    )
}

const SummaryMetric = ({ icon, value, label }) => {
    return (
        <div className='flex flex-col gap-3 items-center rounded-xl border border-neutral3 p-4 shadow-md shadow-shadow lg:shadow-none lg:p-0 lg:border-none'>
            <div>{icon}</div>
            <div className='flex flex-col items-center'>
                <p className='text-xl font-semibold text-neutral0'>{value}</p>
                <p className='text-sm text-neutral1'>{label}</p>               
            </div>
        </div>
    )
}

export default StrategyOverview
