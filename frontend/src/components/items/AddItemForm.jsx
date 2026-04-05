import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Counter from '../popover/Counter'
import Card from '../ui/Card'
import { useAuth } from '../../contexts/AuthContext'
import { createItem } from '../../services/itemService'
import { deleteTripPlan } from '../../services/planService'

const AddItemForm = ({ tripId, setShowAddForm }) => {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        name: '',
        category: 'Uncategorized',
        quantity: 1,
    })
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState(null)
    const [formError, setFormError] = useState('')

    const requiredFieldsForDisable = ['name']

    const hasMissingRequiredField = requiredFieldsForDisable.some((fieldName) => {
        const fieldValue = formData[fieldName]

        if (typeof fieldValue === 'string') {
            return !fieldValue.trim()
        }

        return !fieldValue
    })

    const handleSubmit = async (event) => {
        event.preventDefault()
        setFormError('')

        const quantity = Number(formData.quantity)
        if (!formData.name.trim()) {
            setFormError('Please fill in item name.')
            return
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            setFormError('Quantity must be greater than 0.')
            return
        }

        try {
            if (!user?.uid) {
                throw new Error('You must be logged in to add an item.')
            }

            if (!tripId) {
                throw new Error('Trip id is required to add an item.')
            }

            setCreateError(null)
            setCreating(true)

            await createItem(user.uid, tripId, {
                name: formData.name.trim(),
                category: (formData.category || 'Uncategorized').trim(),
                quantity,
            })

            void deleteTripPlan(user.uid, tripId).catch((errorValue) => {
                console.error('Failed to clear trip plan after adding item', errorValue)
            })

            setFormData({ name: '', category: 'Uncategorized', quantity: 1 })
        } catch (errorValue) {
            setCreateError(errorValue)
            setFormError('Unable to add item right now. Please try again.')
        } finally {
            setCreating(false)
        }
    }

    return (
        <Card>
            <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
                <div className='flex gap-3 flex-col sm:flex-row sm:items-end'>
                    <Input
                        label='Name'
                        id='name'
                        name='name'
                        containerClassName='flex-3'
                        value={formData.name}
                        onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder='e.g. White T-Shirt'
                    />

                    <Counter
                        label='Quantity'
                        id='quantity'
                        containerClassName='flex-1'
                        value={formData.quantity}
                        onChange={(quantity) => setFormData((prev) => ({ ...prev, quantity }))}
                        min={1}
                    />
                </div>

                {formError ? <p className='text-sm text-negative1'>{formError}</p> : null}
                {createError ? <p className='text-sm text-negative1'>{createError.message}</p> : null}

                <div className='flex gap-3 mt-3'>
                    <Button type='submit' loading={creating} disabled={creating || hasMissingRequiredField} className='w-full'>
                        Add Item
                    </Button>
                    <Button variant='secondary' disabled={creating} onClick={() => setShowAddForm(false)}>
                        Cancel
                    </Button>
                </div>
            </form>
        </Card>
    )
}

export default AddItemForm