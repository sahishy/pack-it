import { Link } from 'react-router-dom'
import { FaRegCalendar, FaChevronRight, FaPlane } from 'react-icons/fa6'
import Card from '../ui/Card'
import { useTripItems } from '../../contexts/ItemsContext'
import { getAirlineDisplayById } from '../../utils/airlineUtils'
import { formatDisplayDate } from '../../utils/formatters'
import { FALLBACK_TRIP_THUMBNAIL, getTripDurationDays } from '../../utils/tripUtils'
import { FaScaleBalanced } from 'react-icons/fa6'
import { getTotalWeight } from '../../utils/itemUtils'
import useWeightFormatter from '../../hooks/useWeightFormatter'

const Trip = ({ trip }) => {

    const thumbnail = trip.thumbnailUrl || FALLBACK_TRIP_THUMBNAIL
    const airline = getAirlineDisplayById(trip.airline)
    const formattedStartDate = formatDisplayDate(trip.startDate)
    const formattedEndDate = formatDisplayDate(trip.endDate)
    const hasStartDate = Boolean(trip?.startDate)
    const hasEndDate = Boolean(trip?.endDate)
    const dateRangeLabel = hasStartDate && hasEndDate
        ? `${formattedStartDate} → ${formattedEndDate}`
        : hasStartDate
            ? `Starts ${formattedStartDate}`
            : hasEndDate
                ? `Ends ${formattedEndDate}`
                : 'To be determined'
    const { items } = useTripItems(trip.id)
    const { formatWeight } = useWeightFormatter()
    const tripDurationDays = getTripDurationDays(trip)
    const durationLabel = hasStartDate && hasEndDate
        ? `${tripDurationDays} ${tripDurationDays === 1 ? 'day' : 'days'}`
        : 'TBD'
    const totalWeight = getTotalWeight(items)
    const maxWeight = Number(trip?.maxWeight ?? trip?.baggageLimit ?? 0)
    const isOverWeightLimit = totalWeight > maxWeight
    const hasAirline = Boolean(airline?.name)
    const shouldShowTotalWeight = items.length > 0 && totalWeight > 0
    const hasPlan = Boolean(trip?.planId)
    const isPacked = Boolean(trip?.packed)
    const statusLabel = isPacked ? 'Packed' : hasPlan ? 'Ready to pack' : 'Planning'
    const statusChipClass = isPacked || hasPlan ? 'bg-positive2 text-positive0' : 'bg-warning2 text-warning0'

    return (
        <Link to={`/trips/${trip.id}`}>
            <Card className='flex h-full flex-col overflow-hidden p-0! transition hover:-translate-y-1 hover:shadow-xl'>
                <div className='relative h-52 w-full'>
                    <img
                        src={thumbnail}
                        alt={`${trip.destination} thumbnail`}
                        className='h-full w-full object-cover'
                    />

                    <div className='absolute inset-0 bg-linear-to-t from-black/70 to-transparent' />

                    <div className='absolute inset-x-0 bottom-0 p-4'>
                        <h3 className='text-2xl font-semibold text-white'>{trip.destination}</h3>
                        <p className='flex items-center gap-2 text-sm text-white/90'>
                            <FaRegCalendar className='text-xs' />
                            {dateRangeLabel}
                        </p>
                    </div>
                </div>

                <div className='flex flex-1 flex-col gap-2 p-4 text-sm'>
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
                        ) : (
                            <p className='flex items-center gap-2 text-neutral1'>
                                <FaPlane className='text-neutral1' />
                                No Airline
                            </p>
                        )}
                        <p className='px-3 py-1 bg-neutral4 text-neutral0 text-xs rounded-full'>
                            {durationLabel}
                        </p>
                    </div>
                    {shouldShowTotalWeight ? (
                        <div className='flex justify-between items-center'>
                            <p className='flex gap-2 items-center'><FaScaleBalanced className='text-neutral1' /> Total Weight</p>
                            <p className={`font-medium ${isOverWeightLimit ? 'text-negative1' : 'text-positive1'}`}>
                                {formatWeight(totalWeight, { decimals: 2 })} / {formatWeight(maxWeight, { decimals: 2 })}
                            </p>
                        </div>
                    ) : (
                        <div className='flex justify-between items-center'>
                            <p className='flex gap-2 items-center text-neutral1'>
                                <FaScaleBalanced className='text-neutral1' />
                                No items added
                            </p>
                        </div>
                    )}

                    <div className='mt-auto flex flex-col gap-2'>
                        <hr className='my-2 border-neutral3' />
                        <div className='flex justify-between items-center'>
                            <p className={`px-3 py-1 text-xs rounded-full ${statusChipClass}`}>
                                {statusLabel}
                            </p>
                            <FaChevronRight className='text-neutral1' />
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    )
}

export default Trip