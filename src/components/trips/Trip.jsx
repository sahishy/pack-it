import { Link } from 'react-router-dom'
import { FaRegCalendar, FaChevronRight } from 'react-icons/fa6'
import Card from '../ui/Card'
import { useTripItems } from '../../contexts/ItemsContext'
import { getAirlineDisplayById } from '../../utils/airlineUtils'
import { formatDisplayDate } from '../../utils/formatters'
import { FALLBACK_TRIP_THUMBNAIL, getTripDurationDays } from '../../utils/tripUtils'
import { FaScaleBalanced } from 'react-icons/fa6'
import { getTotalWeight } from '../../utils/itemUtils'

const Trip = ({ trip }) => {

    const thumbnail = trip.thumbnailUrl || FALLBACK_TRIP_THUMBNAIL
    const airline = getAirlineDisplayById(trip.airline)
    const formattedStartDate = formatDisplayDate(trip.startDate)
    const formattedEndDate = formatDisplayDate(trip.endDate)
    const { items } = useTripItems(trip.id)
    const tripDurationDays = getTripDurationDays(trip)
    const totalWeight = getTotalWeight(items)
    const maxWeight = Number(trip?.maxWeight ?? trip?.baggageLimit ?? 0)
    const isOverWeightLimit = totalWeight > maxWeight
    const hasAirline = Boolean(airline?.name)
    const shouldShowTotalWeight = items.length > 0 && totalWeight > 0
    const hasPlan = Boolean(trip?.planId)

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

                <div className='p-4 flex flex-col gap-2 text-sm'>

                    <div className='flex justify-between items-center'>
                        {hasAirline ? (
                            <p className='flex items-center gap-2 text-neutral0'>
                                {airline?.logo ? (
                                    <img
                                        src={airline.logo}
                                        alt={`${airline.name} logo`}
                                        className='h-4 w-4 rounded object-cover'
                                    />
                                ) : null}

                                {airline.name}
                            </p>
                        ) : <span />}
                        <p className='px-3 py-1 bg-neutral4 text-xs rounded-full'>
                            {tripDurationDays} {tripDurationDays === 1 ? 'day' : 'days'}
                        </p>
                    </div>
                    {shouldShowTotalWeight ? (
                        <div className='flex justify-between items-center'>
                            <p className='flex gap-2 items-center'><FaScaleBalanced className='text-neutral1' /> Total Weight</p>
                            <p className={`font-medium ${isOverWeightLimit ? 'text-negative1' : 'text-positive1'}`}>
                                {totalWeight.toFixed(1)} kg / {maxWeight.toFixed(1)} kg
                            </p>
                        </div>
                    ) : null}

                    <hr className='my-2 border-neutral3' />

                    <div className='flex justify-between items-center'>
                        <p className={`px-3 py-1 text-xs rounded-full ${hasPlan ? 'bg-positive2 text-positive0' : 'bg-warning2 text-warning0'}`}>
                            {hasPlan ? 'Ready to pack' : 'Planning'}
                        </p>
                        <FaChevronRight className='text-neutral1'/>
                    </div>

                </div>
            </Card>
        </Link>
    )
}

export default Trip