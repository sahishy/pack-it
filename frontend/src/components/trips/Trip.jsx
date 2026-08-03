import { Link } from 'react-router-dom'
import { Check, Luggage } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TripCardDetails from '@/components/trips/TripCardDetails'
import { FALLBACK_TRIP_THUMBNAIL } from '@/utils/tripUtils'
import { cn } from '@/lib/utils'

const Trip = ({ trip, wide = false }) => {
    return (
        <Link to={`/trips/${trip.id}`} className={cn('group block h-full', wide && 'w-full max-w-md')}>
            <Card className='h-full gap-0! overflow-hidden p-2! transition-shadow group-hover:shadow-[0_12px_30px_rgba(31,41,55,0.06)]'>
                <div className={cn('aspect-[16/9] overflow-hidden rounded-xl bg-muted', wide && 'aspect-[16/8]')}>
                    <img
                        src={trip.thumbnailUrl || FALLBACK_TRIP_THUMBNAIL}
                        alt={`${trip.destination} thumbnail`}
                        className='size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]'
                    />
                </div>
                <CardHeader className='pb-0 pt-4'>
                    <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                            <CardTitle className='truncate text-lg'>{trip.destination}</CardTitle>
                        </div>
                        <Badge variant='secondary' className={trip.packed ? 'border-0 bg-emerald-500/15 text-emerald-700' : 'border-0'}>{trip.packed ? <Check /> : <Luggage />}{trip.packed ? 'Packed' : 'Planning'}</Badge>
                    </div>
                </CardHeader>
                <CardContent className='pb-4 pt-2'>
                    <TripCardDetails trip={trip} iconClassName='size-3.5' textClassName='text-xs' />
                </CardContent>
            </Card>
        </Link>
    )
}

export default Trip
