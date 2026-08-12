import { useState } from 'react'
import { Luggage } from 'lucide-react'
import FormInput from '@/components/common/FormInput'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import useWeightFormatter from '@/hooks/useWeightFormatter'
import { convertLengthFromCm, convertLengthToCm } from '@/utils/measurementUtils'

const EditSuitcaseModal = ({ open, suitcase, onClose, onSubmit, saving = false, error = null }) => {
    const { measurementSystem, lengthUnitLabel } = useWeightFormatter()
    const [formData, setFormData] = useState(() => ({
        name: suitcase?.name ?? '',
        lengthCm: String(suitcase?.dimensions?.lengthCm ?? ''),
        widthCm: String(suitcase?.dimensions?.widthCm ?? ''),
        heightCm: String(suitcase?.dimensions?.heightCm ?? ''),
    }))

    const getDisplayLength = (rawCmValue) => {
        const numericCmValue = Number(rawCmValue)
        if (!Number.isFinite(numericCmValue) || numericCmValue <= 0) return ''
        return String(Number(convertLengthFromCm(numericCmValue, measurementSystem).toFixed(2)))
    }

    const updateLengthFromDisplay = (field, displayValue) => {
        setFormData((current) => {
            if (displayValue === '') return { ...current, [field]: '' }
            const numericDisplayValue = Number(displayValue)
            if (!Number.isFinite(numericDisplayValue) || numericDisplayValue <= 0) {
                return { ...current, [field]: displayValue }
            }
            return {
                ...current,
                [field]: String(Number(convertLengthToCm(numericDisplayValue, measurementSystem).toFixed(4))),
            }
        })
    }

    const dimensions = {
        lengthCm: Number(formData.lengthCm),
        widthCm: Number(formData.widthCm),
        heightCm: Number(formData.heightCm),
    }
    const hasInvalid = !formData.name.trim()
        || Object.values(dimensions).some((value) => !Number.isFinite(value) || value <= 0)

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (hasInvalid) return
        await onSubmit?.({ name: formData.name.trim(), dimensions })
    }

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !saving) onClose?.() }}>
            <DialogContent className='gap-6 rounded-2xl! sm:max-w-lg'>
                <DialogHeader className='gap-2 pr-8'>
                    <div className='mb-1 flex size-10 items-center justify-center rounded-lg bg-muted'><Luggage className='size-5' /></div>
                    <DialogTitle className='text-xl'>Edit suitcase</DialogTitle>
                    <DialogDescription>Update the suitcase name or dimensions.</DialogDescription>
                </DialogHeader>
                <form id='edit-suitcase-form' className='flex flex-col gap-4' onSubmit={handleSubmit}>
                    <FormInput
                        label='Suitcase name'
                        id='edit-suitcase-name'
                        value={formData.name}
                        onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                        disabled={saving}
                    />
                    <div className='grid gap-3 sm:grid-cols-3'>
                        {['lengthCm', 'widthCm', 'heightCm'].map((field) => (
                            <FormInput
                                key={field}
                                label={`${field.replace('Cm', '').replace(/^./, (character) => character.toUpperCase())} (${lengthUnitLabel})`}
                                id={`edit-suitcase-${field}`}
                                type='number'
                                min='0.01'
                                step='0.01'
                                value={getDisplayLength(formData[field])}
                                onChange={(event) => updateLengthFromDisplay(field, event.target.value)}
                                disabled={saving}
                            />
                        ))}
                    </div>
                    {error ? <p className='text-sm text-destructive'>{error.message ?? String(error)}</p> : null}
                </form>
                <DialogFooter className='grid grid-cols-2 gap-3 sm:grid-cols-2'>
                    <Button type='button' variant='outline' className='w-full' onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button type='submit' form='edit-suitcase-form' className='w-full' loading={saving} disabled={saving || hasInvalid}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default EditSuitcaseModal
