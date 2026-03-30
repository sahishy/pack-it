import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../popover/Select'
import Counter from '../popover/Counter'
import Card from '../ui/Card'
import { useAuth } from '../../contexts/AuthContext'
import { createItem } from '../../services/itemService'
import { deleteTripPlan } from '../../services/planService'
import { ITEM_CATEGORIES } from '../../utils/itemUtils'

const CATEGORY_OPTIONS = ITEM_CATEGORIES

const AddItemForm = ({ tripId, setShowAddForm }) => {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        quantity: 1,
    })
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState(null)
    const [formError, setFormError] = useState('')

    const handleSubmit = async (event) => {
        event.preventDefault()
        setFormError('')

        const quantity = Number(formData.quantity)
        if (!formData.name.trim() || !formData.category.trim()) {
            setFormError('Please fill in item name and category.')
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
                category: formData.category.trim(),
                quantity,
            })

            await deleteTripPlan(user.uid, tripId)

            setFormData({ name: '', category: '', quantity: 1 })
            setShowAddForm(false)
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
                <Input
                    label='Name'
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder='e.g. White T-Shirt'
                />

                <div className='grid gap-3 sm:grid-cols-2'>
                    <Select
                        label='Category'
                        id='category'
                        value={formData.category}
                        onChange={(category) => setFormData((prev) => ({ ...prev, category }))}
                        options={CATEGORY_OPTIONS}
                        placeholder='Choose category'
                    />

                    <Counter
                        label='Quantity'
                        id='quantity'
                        value={formData.quantity}
                        onChange={(quantity) => setFormData((prev) => ({ ...prev, quantity }))}
                        min={1}
                    />
                </div>

                {formError ? <p className='text-sm text-negative1'>{formError}</p> : null}
                {createError ? <p className='text-sm text-negative1'>{createError.message}</p> : null}

                <div className='flex gap-3 mt-3'>
                    <Button type='submit' loading={creating} className='w-full'>Add Item</Button>
                    <Button variant='secondary' disabled={creating} onClick={() => setShowAddForm(false)}>
                        Cancel
                    </Button>
                </div>
            </form>
        </Card>
    )
}

export default AddItemForm