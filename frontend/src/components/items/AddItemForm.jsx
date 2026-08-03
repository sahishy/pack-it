import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Counter } from '@/components/ui/counter'
import { Input } from '@/components/ui/input'
import { useAuth } from '../../contexts/AuthContext'
import { createItem } from '../../services/itemService'
import { deleteTripPlan } from '../../services/planService'

const AddItemForm = ({ tripId, suitcaseId = '', onCancel, onSaved }) => {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        name: '',
        category: 'Uncategorized',
        quantity: 1,
    })
    const [creating, setCreating] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        const quantity = Number(formData.quantity)
        if (!formData.name.trim() || !Number.isFinite(quantity) || quantity <= 0) return

        try {
            if (!user?.uid) {
                throw new Error('You must be logged in to add an item.')
            }

            if (!tripId) {
                throw new Error('Trip id is required to add an item.')
            }

            setCreating(true)

            await createItem(user.uid, tripId, {
                name: formData.name.trim(),
                category: (formData.category || 'Uncategorized').trim(),
                quantity,
                suitcaseId,
            })

            void deleteTripPlan(user.uid, tripId).catch((errorValue) => {
                console.error('Failed to clear trip plan after adding item', errorValue)
            })

            onSaved?.()
        } catch (errorValue) {
            console.error('Failed to create item', errorValue)
        } finally {
            setCreating(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className='w-full'>
            <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                    <div className='min-w-0 flex-1 rounded-xl border bg-background px-4'>
                        <Input
                            autoFocus
                            aria-label='Item name'
                            className='h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
                            value={formData.name}
                            onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
                            placeholder='Item name'
                        />
                    </div>
                    <Counter number={Number(formData.quantity) || 1} setNumber={(quantity) => setFormData((previous) => ({ ...previous, quantity }))} min={1} className='h-12 w-32 shrink-0 justify-between rounded-xl! px-2' />
                </div>
                <div className='flex gap-2'>
                    <Button type='button' variant='outline' className='flex-1 rounded-xl!' disabled={creating} onClick={onCancel}>Cancel</Button>
                    <Button type='submit' className='flex-1 rounded-xl!' loading={creating} disabled={creating || !formData.name.trim()}>Add item</Button>
                </div>
            </div>
        </form>
    )
}

export default AddItemForm
