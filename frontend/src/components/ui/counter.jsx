import { useState } from 'react'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/utils'

const MotionDiv = motion.div
const MotionSpan = motion.span

const Counter = ({
    number,
    setNumber,
    value,
    onChange,
    label,
    id,
    min = 0,
    max = 999,
    allowDecimal = false,
    step = 1,
    className,
    containerClassName,
}) => {
    const resolvedMin = Number.isFinite(Number(min)) ? Number(min) : 0
    const resolvedMax = Number.isFinite(Number(max)) ? Math.max(resolvedMin, Number(max)) : Number.POSITIVE_INFINITY
    const resolvedStep = Number.isFinite(Number(step)) && Number(step) > 0 ? Number(step) : 1
    const sourceValue = number ?? value ?? resolvedMin
    const parsedValue = Number(sourceValue)
    const currentValue = Math.min(resolvedMax, Math.max(resolvedMin, Number.isFinite(parsedValue) ? parsedValue : resolvedMin))
    const [draftValue, setDraftValue] = useState(null)
    const stepDecimalPlaces = (String(resolvedStep).split('.')[1] ?? '').length
    const decimalPlaces = allowDecimal ? Math.max(stepDecimalPlaces, 2) : 0
    const updateNumber = setNumber ?? onChange

    const normalizeValue = (nextValue) => {
        const roundedValue = allowDecimal
            ? Number(nextValue.toFixed(decimalPlaces))
            : Math.trunc(nextValue)
        return Math.min(resolvedMax, Math.max(resolvedMin, roundedValue))
    }

    const commitValue = (nextValue) => {
        if (!Number.isFinite(nextValue)) return
        updateNumber?.(normalizeValue(nextValue))
    }

    const handleDecrement = () => {
        const draftNumber = Number(draftValue)
        const baseValue = draftValue !== null && draftValue.trim() !== '' && Number.isFinite(draftNumber) ? draftNumber : currentValue
        commitValue(baseValue - resolvedStep)
        setDraftValue(null)
    }

    const handleIncrement = () => {
        const draftNumber = Number(draftValue)
        const baseValue = draftValue !== null && draftValue.trim() !== '' && Number.isFinite(draftNumber) ? draftNumber : currentValue
        commitValue(baseValue + resolvedStep)
        setDraftValue(null)
    }

    const handleDraftChange = (event) => {
        const nextValue = event.target.value
        const pattern = allowDecimal ? /^\d*(\.\d*)?$/ : /^\d*$/
        if (pattern.test(nextValue)) setDraftValue(nextValue)
    }

    const handleBlur = () => {
        const parsedDraft = Number(draftValue)
        if (draftValue !== null && draftValue.trim() !== '' && Number.isFinite(parsedDraft)) commitValue(parsedDraft)
        setDraftValue(null)
    }

    const control = (
        <MotionDiv
            layout
            transition={{ type: 'spring', bounce: 0, stiffness: 300, damping: 30 }}
            className={cn('flex items-center justify-between gap-2 rounded-lg border bg-background px-2 py-1', label && 'w-full', className)}
        >
            <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button type='button' size='icon-xs' variant='ghost' className='size-8' onClick={handleDecrement} disabled={currentValue <= resolvedMin} aria-label='Decrease quantity'>
                    <MinusIcon className='size-3.5' />
                </Button>
            </MotionDiv>
            <MotionSpan
                key={currentValue}
                initial={{ opacity: 0.45, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className='flex min-w-0 flex-1 items-center justify-center text-center text-sm font-medium tabular-nums'
            >
                <input
                    id={id}
                    type='text'
                    inputMode={allowDecimal ? 'decimal' : 'numeric'}
                    value={draftValue ?? String(currentValue)}
                    onFocus={(event) => {
                        setDraftValue(String(currentValue))
                        event.currentTarget.select()
                    }}
                    onChange={handleDraftChange}
                    onBlur={handleBlur}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault()
                            event.currentTarget.blur()
                        }
                    }}
                    aria-label={typeof label === 'string' ? label : 'Quantity'}
                    className='h-8 min-w-0 w-full bg-transparent text-center text-[inherit] leading-8 font-[inherit] tabular-nums outline-none selection:bg-primary/20'
                />
            </MotionSpan>
            <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button type='button' size='icon-xs' variant='ghost' className='size-8' onClick={handleIncrement} disabled={currentValue >= resolvedMax} aria-label='Increase quantity'>
                    <PlusIcon className='size-3.5' />
                </Button>
            </MotionDiv>
        </MotionDiv>
    )

    if (!label) return control

    return (
        <Field className={containerClassName}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {control}
        </Field>
    )
}

export { Counter }
