import { MinusIcon, PlusIcon } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MotionDiv = motion.div
const MotionSpan = motion.span

const Counter = ({ number, setNumber, min = 0, className }) => {
    const handleDecrement = () => setNumber(Math.max(min, number - 1))
    const handleIncrement = () => setNumber(number + 1)

    return (
        <MotionDiv
            layout
            transition={{ type: 'spring', bounce: 0, stiffness: 300, damping: 30 }}
            className={cn('flex items-center gap-2 rounded-lg border bg-background px-2 py-1', className)}
        >
            <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button type='button' size='icon-xs' variant='ghost' className='size-8' onClick={handleDecrement} disabled={number <= min} aria-label='Decrease quantity'>
                    <MinusIcon className='size-3.5' />
                </Button>
            </MotionDiv>
            <MotionSpan key={number} initial={{ opacity: 0.5, y: -2 }} animate={{ opacity: 1, y: 0 }} className='min-w-[2ch] text-center text-sm font-medium tabular-nums'>
                {number}
            </MotionSpan>
            <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button type='button' size='icon-xs' variant='ghost' className='size-8' onClick={handleIncrement} aria-label='Increase quantity'>
                    <PlusIcon className='size-3.5' />
                </Button>
            </MotionDiv>
        </MotionDiv>
    )
}

export { Counter }
