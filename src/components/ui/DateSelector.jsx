import { useEffect, useMemo, useState } from 'react'
import { FaChevronLeft, FaChevronRight, FaRegCalendar } from 'react-icons/fa6'
import BasePopover from '../popover/BasePopover'
import Button from './Button'
import { formatDisplayDate, getDateFromValue, toIsoDate } from '../../utils/formatters'

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const DateSelector = ({
    label,
    id,
    name,
    value,
    onChange,
    containerClassName = '',
    placeholder = 'Select date',
}) => {
    const displayValue = formatDisplayDate(value)
    const [viewDate, setViewDate] = useState(() => {
        const selected = getDateFromValue(value)
        const baseDate = selected ?? new Date()
        return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
    })

    const selectedDate = useMemo(() => getDateFromValue(value), [value])

    useEffect(() => {
        if (!selectedDate) {
            return
        }

        setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    }, [selectedDate])

    const monthLabel = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
    }).format(viewDate)

    const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    const firstWeekday = monthStart.getDay()
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
    const daysInPreviousMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate()

    const cells = []

    for (let index = 0; index < firstWeekday; index += 1) {
        const dayNumber = daysInPreviousMonth - firstWeekday + index + 1
        cells.push({
            date: new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, dayNumber),
            inCurrentMonth: false,
        })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push({
            date: new Date(viewDate.getFullYear(), viewDate.getMonth(), day),
            inCurrentMonth: true,
        })
    }

    let nextMonthDay = 1
    while (cells.length % 7 !== 0) {
        cells.push({
            date: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, nextMonthDay),
            inCurrentMonth: false,
        })
        nextMonthDay += 1
    }

    const goToPreviousMonth = () => {
        setViewDate((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1))
    }

    const goToNextMonth = () => {
        setViewDate((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1))
    }

    return (
        <div className={containerClassName}>
            {label ? (
                <label htmlFor={id} className='text-sm font-medium text-neutral0'>
                    {label}
                </label>
            ) : null}

            <BasePopover
                contentClassName='rounded-xl border border-neutral3 bg-neutral5 p-3 shadow-md shadow-shadow'
                trigger={({ open, toggle }) => (
                    <button
                        id={id}
                        type='button'
                        onClick={toggle}
                        className={`flex w-full items-center justify-between rounded-xl border border-neutral2 bg-neutral5 px-3 py-2.5 text-sm text-neutral0 outline-none transition focus:border-neutral1 focus:ring-2 focus:ring-neutral3 ${label ? 'mt-1' : ''}`}
                        aria-haspopup='dialog'
                        aria-expanded={open}
                    >
                        <span className={displayValue ? 'text-neutral0' : 'text-neutral1'}>
                            {displayValue || placeholder}
                        </span>

                        <FaRegCalendar className='text-neutral1' aria-hidden='true' />
                    </button>
                )}
            >
                {({ close }) => (
                    <div className='w-72 p-1 text-neutral0'>
                        <div className='mb-2.5 flex items-center justify-between'>
                            <Button
                                type='button'
                                variant='secondary'
                                onClick={goToPreviousMonth}
                                className='p-0! h-8 w-8 text-[11px]! text-neutral1!'
                                aria-label='Previous month'
                            >
                                <FaChevronLeft />
                            </Button>

                            <p className='text-lg font-semibold text-neutral0'>{monthLabel}</p>

                            <Button
                                type='button'
                                variant='secondary'
                                onClick={goToNextMonth}
                                className='p-0! h-8 w-8 text-[11px]! text-neutral1!'
                                aria-label='Next month'
                            >
                                <FaChevronRight />
                            </Button>
                        </div>

                        <div className='mb-1.5 grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral1'>
                            {WEEKDAY_LABELS.map((weekday) => (
                                <span key={weekday}>{weekday}</span>
                            ))}
                        </div>

                        <div className='grid grid-cols-7 gap-1'>
                            {cells.map(({ date, inCurrentMonth }) => {
                                const isoValue = toIsoDate(date)
                                const isSelected = isoValue === value

                                return (
                                    <button
                                        key={isoValue}
                                        type='button'
                                        className={`flex h-8 w-8 items-center justify-center rounded-md text-[13px] ${isSelected ? 'bg-neutral0 text-neutral5' : inCurrentMonth ? 'text-neutral0 hover:bg-neutral4' : 'text-neutral2 hover:bg-neutral4'}`}
                                        onClick={() => {
                                            onChange?.({ target: { name, value: isoValue } })
                                            close()
                                        }}
                                    >
                                        {date.getDate()}
                                    </button>
                                )
                            })}
                        </div>

                        {value ? (
                            <Button
                                type='button'
                                variant='secondary'
                                className='mt-3 w-full'
                                onClick={() => {
                                    onChange?.({ target: { name, value: '' } })
                                    close()
                                }}
                            >
                                Clear
                            </Button>
                        ) : null}
                    </div>
                )}
            </BasePopover>
        </div>
    )
}

export default DateSelector