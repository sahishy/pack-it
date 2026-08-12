import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ListTodo, Plus } from 'lucide-react'
import { BiSolidPlaneAlt } from "react-icons/bi";
import { useTrips } from '@/contexts/TripsContext'
import Trip from '@/components/trips/Trip'
import TripCardDetails from '@/components/trips/TripCardDetails'
import TripGhost from '@/components/ghost/TripGhost'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ErrorScreen from '@/components/common/ErrorScreen'
import Cloud from '@/assets/images/cloud.png'
import logo_sm_white from '@/assets/logo_sm_white.png'
import { FALLBACK_TRIP_THUMBNAIL } from '@/utils/tripUtils'
import NewTrip from './NewTrip'

const getCreatedAtMs = (trip) => {
    const createdAt = trip?.createdAt
    if (!createdAt) return 0
    if (typeof createdAt?.toMillis === 'function') return createdAt.toMillis()
    if (createdAt instanceof Date) return createdAt.getTime()
    const parsed = new Date(createdAt).getTime()
    return Number.isNaN(parsed) ? 0 : parsed
}

const getDaysUntilStart = (startDate) => {
    if (!startDate) return null

    const [year, month, day] = startDate.split('-').map(Number)
    if (!year || !month || !day) return null

    const today = new Date()
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    const startUtc = Date.UTC(year, month - 1, day)
    const daysUntilStart = Math.round((startUtc - todayUtc) / 86_400_000)

    return daysUntilStart >= 0 ? daysUntilStart : null
}

const FeaturedTrip = ({ trip }) => {
    const daysUntilStart = getDaysUntilStart(trip.startDate)
    const countdownLabel = daysUntilStart === null
        ? null
        : daysUntilStart === 0
            ? 'Today'
            : `${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'}`

    return (
        <Card className='group grid gap-2! overflow-hidden p-2! transition-shadow hover:shadow-[0_12px_30px_rgba(31,41,55,0.06)] md:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]'>
                <div className='relative aspect-video overflow-hidden rounded-xl bg-muted'>
                    <img src={trip.thumbnailUrl || FALLBACK_TRIP_THUMBNAIL} alt={`${trip.destination} thumbnail`} className='block size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]' />
                    {countdownLabel && <Badge className='absolute right-3 top-3 border-0 bg-neutral1/20 text-white shadow-sm backdrop-blur-xl'><BiSolidPlaneAlt className='text-white' />{countdownLabel}</Badge>}
                </div>
                <div className='flex min-w-0 flex-col p-6 sm:p-7'>
                    <div className='flex items-start justify-between gap-4'>
                        <div className='min-w-0'>
                            <h2 className='truncate text-2xl font-semibold tracking-tight'>{trip.destination}</h2>
                        </div>
                        <Badge variant='secondary' className={trip.packed ? 'border-0 bg-emerald-500/15 text-emerald-700' : 'border-0 text-neutral1'}>{trip.packed ? <Check /> : <ListTodo />}{trip.packed ? 'Packed' : 'Planning'}</Badge>
                    </div>
                    <TripCardDetails trip={trip} className='mt-4' />

                    <div className='mt-auto pt-8'>
                        <Button className='mt-5 w-full' render={<Link to={`/trips/${trip.id}`} />}>Continue</Button>
                    </div>
                </div>
        </Card>
    )
}

const Home = () => {
    const { trips, loading, error } = useTrips()
    const [isNewTripOpen, setIsNewTripOpen] = useState(false)
    const sortedTrips = [...trips].sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a))
    const featuredTrip = sortedTrips[0]
    const remainingTrips = sortedTrips.slice(1)
    const continueTripName = (featuredTrip?.name?.trim() || featuredTrip?.destination?.trim() || 'your next trip')
        .split(',')[0]
        .trim()

    if (error) return <ErrorScreen text={error.message ?? 'Failed to load trips.'} />

    return (
        <main className='relative isolate min-h-full overflow-hidden bg-background'>
            <div
                aria-hidden='true'
                className='pointer-events-none absolute inset-x-0 top-0 z-0 h-[29rem] opacity-80 sm:h-[28rem]'
                style={{ backgroundImage: 'var(--home-sky-gradient)' }} />
            <div aria-hidden='true' className='night-sky-stars pointer-events-none absolute inset-x-0 top-0 z-0 h-[29rem] sm:h-[28rem]' />
            <img src={Cloud} alt='' aria-hidden='true' className='pointer-events-none absolute left-[-5.5rem] top-[9rem] z-0 w-[17rem] max-w-none rotate-[5deg] scale-x-[-1] opacity-95 dark:opacity-[0.03] sm:left-[-4rem] sm:top-[7rem] sm:w-[22rem]' />
            <img src={Cloud} alt='' aria-hidden='true' className='pointer-events-none absolute right-[-5.5rem] top-[11rem] z-0 w-[17rem] max-w-none -rotate-[2deg] opacity-95 dark:opacity-[0.03] sm:right-[-4rem] sm:top-[8rem] sm:w-[22rem]' />

            <section className='relative z-10 overflow-visible'>
                <div className='relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-5 pb-10 pt-[calc(5rem+env(safe-area-inset-top))] text-center sm:px-8 sm:pt-18 lg:px-10'>
                    <header className='flex flex-col items-center'>
                        <img src={logo_sm_white} alt='Pack-It' className='mb-4 size-15 animate-[chat-empty-state-in_500ms_ease-out_both] object-contain motion-reduce:animate-none' />
                        <h1 className='max-w-sm animate-[chat-empty-state-in_500ms_ease-out_80ms_both] text-3xl font-semibold leading-[1.05] tracking-tight text-white motion-reduce:animate-none sm:text-4xl'>
                            {featuredTrip ? `Continue packing for ${continueTripName}?` : 'Welcome to Pack-it'}
                        </h1>
                    </header>

                    {loading || featuredTrip ? <div className='mt-8 w-full max-w-4xl translate-y-16 text-left sm:translate-y-10'>
                        {loading ? (
                            <div className='w-full max-w-xl mx-auto'><TripGhost /></div>
                        ) : (
                            <FeaturedTrip trip={featuredTrip} />
                        )}
                    </div> : null}
                </div>
            </section>

            <section className={`relative z-10 mx-auto w-full max-w-4xl px-5 pb-12 sm:px-8 sm:pb-16 lg:px-10 ${!loading && !featuredTrip ? 'mt-24' : 'pt-20'}`}>
                <div className='flex items-center justify-between gap-4'>
                    <h2 className='text-lg font-medium text-foreground'>Your trips</h2>
                    <Button onClick={() => setIsNewTripOpen(true)}><Plus />New trip</Button>
                </div>
                {loading ? (
                    <div className='mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
                        <TripGhost />
                        <TripGhost />
                        <TripGhost />
                    </div>
                ) : remainingTrips.length > 0 ? (
                    <div className='mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
                        {remainingTrips.map((trip) => <Trip key={trip.id} trip={trip} />)}
                    </div>
                ) : (
                    <p className='mt-3 text-sm text-muted-foreground'>{featuredTrip ? 'Your saved trips will appear here.' : 'Create a trip to start your travel plans.'}</p>
                )}
            </section>
            {isNewTripOpen ? <NewTrip open onClose={() => setIsNewTripOpen(false)} /> : null}
        </main>
    )
}

export default Home
