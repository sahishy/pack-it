import { useNavigate } from 'react-router-dom'
import { FaArrowTrendUp, FaPlus, FaSuitcase, FaSuitcaseRolling } from 'react-icons/fa6'
import { useTrips } from '../contexts/TripsContext'
import Trip from '../components/trips/Trip'
import TripGhost from '../components/ghost/TripGhost'
import { getTotalTripsCount, getUpcomingTripsCount } from '../utils/tripUtils'
import Button from '../components/ui/Button'
import ErrorScreen from '../components/ui/ErrorScreen'
import { PiHandWavingFill } from 'react-icons/pi'

const Home = () => {

    const { trips, loading: tripsLoading, error: tripsError } = useTrips()

    const totalTrips = getTotalTripsCount(trips);
    const upcomingTrips = getUpcomingTripsCount(trips);

    const sortedTrips = [...trips].sort((a, b) => {
        const getCreatedAtMs = (trip) => {
            const createdAt = trip?.createdAt

            if (!createdAt) {
                return 0
            }

            if (typeof createdAt?.toMillis === 'function') {
                return createdAt.toMillis()
            }

            if (createdAt instanceof Date) {
                return createdAt.getTime()
            }

            const parsed = new Date(createdAt).getTime()
            return Number.isNaN(parsed) ? 0 : parsed
        }

        return getCreatedAtMs(b) - getCreatedAtMs(a)
    })

    if (tripsError) {
        return <ErrorScreen text={tripsError.message ?? 'Failed to load trips.'} className='bg-neutral4' />
    }

    return (
        <main className='min-h-screen bg-neutral5'>
            <section className='w-full bg-none from-primary0 to-primary1 lg:bg-linear-to-r'>
                <div className='m-6 flex max-w-4xl flex-col gap-6 px-6 py-10 rounded-xl bg-linear-to-r from-primary0 to-primary1 lg:m-auto lg:bg-none'>
                    <div className='flex flex-col gap-2 text-center items-center lg:text-left lg:items-start'>
                        <h2 className='flex gap-2 items-center text-sm text-white/80'><PiHandWavingFill className='text-lg'/> Ready for adventure?</h2>
                        <h1 className='text-4xl lg:text-5xl font-bold text-white'>Welcome to Pack-It</h1>
                        <p className='text-white/80'>Your intelligent travel packing assistant</p>
                    </div>

                    <div className='flex flex-col flex-nowrap gap-4 items-center justify-center lg:justify-start lg:flex-row lg:items-start lg:gap-6'>
                        <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 shrink-0 rounded-full bg-white/20 items-center justify-center'>
                                <FaSuitcaseRolling className='text-xl text-white' />
                            </div>
                            <div>
                                <p className='text-xl font-bold text-white'>{totalTrips}</p>
                                <p className='text-sm text-white/80'>Total Trip{totalTrips !== 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 shrink-0 rounded-full bg-white/20 items-center justify-center'>
                                <FaArrowTrendUp className='text-xl text-white' />
                            </div>
                            <div>
                                <p className='text-xl font-bold text-white'>{upcomingTrips}</p>
                                <p className='text-sm text-white/80'>Upcoming Trip{upcomingTrips !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-4 lg:py-10'>
                <section>
                    <h2 className='text-xl font-semibold text-neutral0'>Your Trips</h2>

                    {tripsLoading ? (
                        <div className='mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2'>
                            <TripGhost />
                            <TripGhost />
                            <TripGhost />
                            <TripGhost />
                        </div>
                    ) : sortedTrips.length === 0 ? (
                        <p className='mt-2 text-sm text-neutral1'>No trips yet. Click + to create your first one.</p>
                    ) : (
                        <div className='mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2'>
                            {sortedTrips.map((trip) => (
                                <Trip key={trip.id} trip={trip} />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <FloatingActionButton />

        </main>
    )
}

const FloatingActionButton = () => {

    const navigate = useNavigate();

    return (
        <Button
            type='button'
            aria-label='Create trip'
            onClick={() => navigate('/trips/new')}
            className={`fixed bottom-12 right-12 h-16 w-16 rounded-full! hover:scale-110 hidden! lg:flex!`}
        >
            <FaPlus className='text-xl' />
        </Button>
    )

}

export default Home
