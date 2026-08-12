import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldLabel } from '@/components/ui/field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDisplayDate, getDateFromValue, toIsoDate } from '@/utils/formatters'

const DateRangeSelector = ({
    label,
    id,
    startDate,
    endDate,
    onChange,
    containerClassName = '',
    placeholder = 'Select trip dates',
}) => {
    const [open, setOpen] = useState(false)
    const [rangeStart, setRangeStart] = useState(null)
    const [selectingEnd, setSelectingEnd] = useState(false)
    const from = getDateFromValue(startDate)
    const to = getDateFromValue(endDate)
    const selected = from ? { from, to: to ?? undefined } : undefined

    const handleOpenChange = (nextOpen) => {
        setOpen(nextOpen)

        if (!nextOpen) {
            setRangeStart(null)
            setSelectingEnd(false)
        }
    }

    const handleDayClick = (date) => {
        if (!selectingEnd || !rangeStart) {
            setRangeStart(date)
            setSelectingEnd(true)
            onChange?.({ startDate: toIsoDate(date), endDate: '' })
            return
        }

        const nextFrom = date < rangeStart ? date : rangeStart
        const nextTo = date < rangeStart ? rangeStart : date

        onChange?.({ startDate: toIsoDate(nextFrom), endDate: toIsoDate(nextTo) })
        setRangeStart(null)
        setSelectingEnd(false)
        setOpen(false)
    }

    const displayValue = startDate
        ? endDate
            ? `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
            : `${formatDisplayDate(startDate)} – Pick an end date`
        : placeholder

    return (
        <Field className={containerClassName}>
            {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
            <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger
                    render={(
                        <Button
                            id={id}
                            variant='outline'
                            className='w-full justify-start rounded-lg! text-left font-normal'
                        />
                    )}
                >
                    <CalendarIcon />
                    <span className={!startDate ? 'text-muted-foreground' : ''}>{displayValue}</span>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                        mode='range'
                        selected={selected}
                        onDayClick={handleDayClick}
                        defaultMonth={from ?? undefined}
                        numberOfMonths={2}
                        autoFocus
                    />
                </PopoverContent>
            </Popover>
        </Field>
    )
}

export default DateRangeSelector
