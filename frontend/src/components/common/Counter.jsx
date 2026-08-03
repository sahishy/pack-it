import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FaMinus, FaPlus } from 'react-icons/fa6'

const Counter = ({
    label,
    id,
    value = 1,
    onChange,
    min = 1,
    max = 999,
    allowDecimal = false,
    step = 1,
    className = '',
    containerClassName = '',
}) => {
    const [open, setOpen] = useState(false)
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
    const resolvedStep = Number.isFinite(Number(step)) && Number(step) > 0 ? Number(step) : 1
    const stepDecimals = allowDecimal
        ? ((String(resolvedStep).split('.')[1] ?? '').length)
        : 0
    const allowedDecimalPlaces = allowDecimal ? (stepDecimals || 2) : 0

    useEffect(() => {
        setDraftValue(String(currentValue))
    }, [currentValue])

    const updateValue = (nextValue) => {
        const roundedValue = allowDecimal
            ? Number(nextValue.toFixed(stepDecimals || 2))
            : Math.trunc(nextValue)
        const safeValue = Math.min(max, Math.max(min, roundedValue))
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

        const integerPattern = /^\d+$/
        const decimalPattern = /^\d+(\.\d*)?$/

        if (!(allowDecimal ? decimalPattern.test(nextValue) : integerPattern.test(nextValue))) {
            return
        }

        if (!allowDecimal && nextValue.length > String(max).length) {
            return
        }

        setDraftValue(nextValue)
    }

    const adjustLocalValue = (delta) => {
        const nextValue = Math.min(max, Math.max(min, localValue + delta))
        const normalizedValue = allowDecimal
            ? Number(nextValue.toFixed(allowedDecimalPlaces)).toString()
            : String(Math.trunc(nextValue))
        setDraftValue(normalizedValue)
    }

    return (
        <Field className={containerClassName}>
            {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                    render={(
                        <Button
                            id={id}
                            type='button'
                            variant='outline'
                            onFocus={() => setDraftValue(String(currentValue))}
                            className={`w-full justify-between font-normal ${className}`}
                        />
                    )}
                >
                    <span>{currentValue}</span>
                </PopoverTrigger>
                <PopoverContent align='start'>
                    <div className='flex flex-col gap-3'>
                        <div className='flex items-center justify-between gap-4'>
                            <Button
                                type='button'
                                variant='outline'
                                size='icon'
                                onClick={() => adjustLocalValue(-resolvedStep)}
                                disabled={localValue <= min}
                                aria-label='Decrease quantity'
                            >
                                <FaMinus/>
                            </Button>

                            <Input
                                type='number'
                                inputMode='numeric'
                                pattern={allowDecimal ? '[0-9]*[.]?[0-9]*' : '[0-9]*'}
                                step={allowDecimal ? resolvedStep : 1}
                                value={draftValue}
                                onChange={handleInputChange}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault()
                                    }
                                }}
                                className='no-spinner w-20 text-center text-lg font-semibold'
                                aria-label='Quantity'
                            />

                            <Button
                                type='button'
                                variant='outline'
                                size='icon'
                                onClick={() => adjustLocalValue(resolvedStep)}
                                disabled={localValue >= max}
                                aria-label='Increase quantity'
                            >
                                <FaPlus/>
                            </Button>
                        </div>

                        <Button
                            type='button'
                            disabled={isDoneDisabled}
                            onClick={() => {
                                commitDraftValue()
                                setOpen(false)
                            }}
                            className='w-full'
                        >
                            Done
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </Field>
    )
}

export default Counter
