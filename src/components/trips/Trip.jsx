import { Link } from 'react-router-dom'
import { FaRegCalendar } from 'react-icons/fa6'
import Card from '../ui/Card'
import { getAirlineDisplayById } from '../../utils/airlineUtils'
import { formatDisplayDate } from '../../utils/formatters'
import { FALLBACK_TRIP_THUMBNAIL } from '../../utils/tripUtils'

const Trip = ({ trip }) => {

    const thumbnail = trip.thumbnailUrl || FALLBACK_TRIP_THUMBNAIL
    const airline = getAirlineDisplayById(trip.airline)
    const formattedStartDate = formatDisplayDate(trip.startDate)
    const formattedEndDate = formatDisplayDate(trip.endDate)

    return (
        <Link to={`/trips/${trip.id}`}>
            <Card className='overflow-hidden p-0! transition hover:-translate-y-1 hover:shadow-xl'>
                <div className='relative h-52 w-full'>
                    <img
                        src={thumbnail}
                        alt={`${trip.destination} thumbnail`}
                        className='h-full w-full object-cover'
                    />

                    <div className='absolute inset-0 bg-linear-to-t from-neutral0/70 to-transparent' />

                    <div className='absolute inset-x-0 bottom-0 p-4'>
                        <h3 className='text-2xl font-semibold text-white'>{trip.destination}</h3>
                        <p className='flex items-center gap-2 text-sm text-white/90'>
                            <FaRegCalendar className='text-xs' />
                            {formattedStartDate} → {formattedEndDate}
                        </p>
                    </div>
                </div>

                <div className='p-4'>
                    <p className='flex items-center gap-2 text-sm text-neutral0'>
                        {airline?.logo ? (
                            <img
                                src={airline.logo}
                                alt={`${airline.name} logo`}
                                className='h-4 w-4 rounded object-cover'
                            />
                        ) : null}

                        {airline?.name || 'Airline not set'}
                    </p>
                </div>
            </Card>
        </Link>
    )
}

export default Trip