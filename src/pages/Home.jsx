import { Navigate } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { FaArrowTrendUp, FaPlus, FaSuitcase, FaSuitcaseRolling } from 'react-icons/fa6'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripsContext'
import Topbar from '../components/ui/Topbar'
import Trip from '../components/trips/Trip'
import { getTotalTripsCount, getUpcomingTripsCount } from '../utils/tripUtils'
import Button from '../components/ui/Button'
import LoadingScreen from '../components/ui/LoadingScreen'
import ErrorScreen from '../components/ui/ErrorScreen'

const Home = () => {

    const { user, profile, logout } = useAuth()
    const { trips, loading: tripsLoading, error: tripsError } = useTrips()

    const totalTrips = getTotalTripsCount(trips);
    const upcomingTrips = getUpcomingTripsCount(trips);

    if (!user) {
        return <Navigate to='/login' replace />
    }

    if (tripsLoading) {
        return <LoadingScreen text='Loading trips...' className='bg-neutral4' />
    }

    if (tripsError) {
        return <ErrorScreen text={tripsError.message ?? 'Failed to load trips.'} className='bg-neutral4' />
    }

    const displayName = profile?.firstName ? `${profile.firstName} ${profile?.lastName ?? ''}`.trim() : user.email

    return (
        <main className='min-h-screen'>
            <Topbar displayName={displayName} email={user.email} onLogout={logout} />

            <section className='w-full bg-linear-to-r from-primary0 to-primary1'>
                <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10'>
                    <div>
                        <h1 className='text-5xl font-bold text-neutral4'>Welcome to Pack-It</h1>
                        <p className='mt-2 text-neutral4/90'>Your intelligent travel packing assistant</p>
                    </div>

                    <div className='flex flex-nowrap gap-6'>
                        <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 shrink-0 rounded-full bg-neutral5/20 items-center justify-center'>
                                <FaSuitcaseRolling className='text-xl text-neutral5' />
                            </div>
                            <div>
                                <p className='text-xl font-bold text-neutral4'>{totalTrips}</p>
                                <p className='text-sm text-neutral4/90'>Total Trip{totalTrips !== 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 shrink-0 rounded-full bg-neutral5/20 items-center justify-center'>
                                <FaArrowTrendUp className='text-xl text-neutral5' />
                            </div>
                            <div>
                                <p className='text-xl font-bold text-neutral4'>{upcomingTrips}</p>
                                <p className='text-sm text-neutral4/90'>Upcoming Trip{upcomingTrips !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10'>
                <section>
                    <h2 className='text-xl font-semibold text-neutral0'>Your Trips</h2>

                    {trips.length === 0 ? (
                        <p className='mt-2 text-sm text-neutral1'>No trips yet. Click + to create your first one.</p>
                    ) : (
                        <div className='mt-4 grid gap-4 grid-cols-2'>
                            {trips.map((trip) => (
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
            className={`fixed bottom-12 right-12 h-16 w-16 rounded-full! hover:scale-110`}
        >
            <FaPlus className='text-xl' />
        </Button>
    )

}

export default Home
