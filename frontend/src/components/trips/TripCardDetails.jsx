import { CalendarDays, Luggage, Package } from 'lucide-react'
import { useTripItems } from '@/contexts/ItemsContext'
import { useSuitcases } from '@/contexts/SuitcasesContext'
import { formatDisplayDate } from '@/utils/formatters'
import { cn } from '@/lib/utils'

const TripCardDetails = ({ trip, className, iconClassName = 'size-4', textClassName = 'text-sm' }) => {
    const { items } = useTripItems(trip.id)
    const { suitcases } = useSuitcases()
    const dateLabel = trip.startDate && trip.endDate
        ? `${formatDisplayDate(trip.startDate)} – ${formatDisplayDate(trip.endDate)}`
        : 'Dates not set'
    const showSuitcaseCount = suitcases.length > 1
    const count = showSuitcaseCount ? suitcases.length : items.length
    const label = showSuitcaseCount
        ? `${count} suitcases`
        : `${count} ${count === 1 ? 'item' : 'items'}`
    const CountIcon = showSuitcaseCount ? Luggage : Package

    return (
        <div className={cn('space-y-2 text-muted-foreground', className)}>
            <p className={cn('flex items-center gap-2', textClassName)}><CalendarDays className={iconClassName} />{dateLabel}</p>
            <p className={cn('flex items-center gap-2', textClassName)}><CountIcon className={iconClassName} />{label}</p>
        </div>
    )
}

export default TripCardDetails
