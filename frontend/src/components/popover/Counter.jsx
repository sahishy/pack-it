import { useEffect, useState } from 'react'
import BasePopover from './BasePopover'
import Button from '../ui/Button'
import { FaMinus, FaPlus } from 'react-icons/fa6'

const Counter = ({
    label,
    id,
    value = 1,
    onChange,
    min = 1,
    max = 999,
    className = '',
    containerClassName = '',
}) => {
    const parsedValue = Number(value)
    const hasValidValue = Number.isFinite(parsedValue)
    const currentValue = hasValidValue ? Math.min(max, Math.max(min, parsedValue)) : min
    const [draftValue, setDraftValue] = useState(String(currentValue))
    const parsedDraftValue = Number(draftValue)
    const trimmedDraftValue = draftValue.trim()
    const isDoneDisabled =
        trimmedDraftValue === '' ||
        (Number.isFinite(parsedDraftValue) && parsedDraftValue === 0)
    const localValue = Number.isFinite(parsedDraftValue) ? parsedDraftValue : min

    useEffect(() => {
        setDraftValue(String(currentValue))
    }, [currentValue])

    const updateValue = (nextValue) => {
        const safeValue = Math.min(max, Math.max(min, nextValue))
        onChange?.(safeValue)
    }

    const commitDraftValue = () => {
        const trimmed = draftValue.trim()

        if (!trimmed) {
            const fallbackValue = String(min)
            setDraftValue(fallbackValue)
            updateValue(Number(fallbackValue))
            return
        }

        const parsedValue = Number(trimmed)

        if (!Number.isFinite(parsedValue)) {
            const fallbackValue = String(min)
            setDraftValue(fallbackValue)
            updateValue(Number(fallbackValue))
            return
        }

        updateValue(parsedValue)
    }

    const handleInputChange = (event) => {
        const nextValue = event.target.value

        if (nextValue === '') {
            setDraftValue('')
            return
        }

        if (!/^\d+$/.test(nextValue)) {
            return
        }

        if (nextValue.length > String(max).length) {
            return
        }

        setDraftValue(nextValue)
    }

    const adjustLocalValue = (delta) => {
        const nextValue = Math.min(max, Math.max(min, localValue + delta))
        setDraftValue(String(nextValue))
    }

    return (
        <div className={containerClassName}>
            {label ? (
                <label htmlFor={id} className='text-sm font-medium text-neutral0'>
                    {label}
                </label>
            ) : null}

            <BasePopover
                contentClassName='min-w-44 rounded-xl border border-neutral3 bg-neutral5 p-3 shadow-md shadow-shadow'
                trigger={({ open, toggle }) => (
                    <button
                        id={id}
                        type='button'
                        onFocus={() => {
                            if (!open) {
                                setDraftValue(String(currentValue))
                                toggle()
                            }
                        }}
                        className={`mt-1 flex w-full items-center justify-between rounded-xl border border-neutral2 bg-neutral5 px-3 py-2.5 text-sm text-neutral0 outline-none transition focus:border-neutral1 focus:ring-2 focus:ring-neutral3 ${className}`}
                        aria-haspopup='dialog'
                        aria-expanded={open}
                    >
                        <span>{currentValue}</span>
                    </button>
                )}
            >
                {({ close }) => (
                    <div className='flex flex-col gap-3'>
                        <div className='flex items-center justify-between gap-4'>
                            <Button
                                type='button'
                                variant='secondary'
                                className='p-0! h-10 w-10 text-xs! text-neutral1!'
                                onClick={() => adjustLocalValue(-1)}
                                disabled={localValue <= min}
                                aria-label='Decrease quantity'
                            >
                                <FaMinus/>
                            </Button>

                            <input
                                type='number'
                                inputMode='numeric'
                                pattern='[0-9]*'
                                value={draftValue}
                                onChange={handleInputChange}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault()
                                    }
                                }}
                                className='no-spinner h-10 w-16 bg-transparent px-1 text-center text-2xl font-bold text-neutral0 outline-none'
                                aria-label='Quantity'
                            />

                            <Button
                                type='button'
                                variant='secondary'
                                className='p-0! h-10 w-10 text-xs! text-neutral1!'
                                onClick={() => adjustLocalValue(1)}
                                disabled={localValue >= max}
                                aria-label='Increase quantity'
                            >
                                <FaPlus/>
                            </Button>
                        </div>

                        <Button
                            type='button'
                            variant='secondary'
                            disabled={isDoneDisabled}
                            onClick={() => {
                                commitDraftValue()
                                close()
                            }}
                            className='w-full'
                        >
                            Done
                        </Button>
                    </div>
                )}
            </BasePopover>
        </div>
    )
}

export default Counter