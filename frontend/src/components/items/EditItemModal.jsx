import { useEffect, useState } from 'react'
import BaseModal from '../ui/BaseModal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { hasLowConfidence } from '../../utils/itemUtils'
import useWeightFormatter from '../../hooks/useWeightFormatter'
import {
    convertLengthFromCm,
    convertLengthToCm,
    convertWeightFromKg,
    convertWeightToKg,
} from '../../utils/measurementUtils'

const EditItemModal = ({
    open,
    item,
    onClose,
    onSubmit,
    saving = false,
    error = null,
}) => {
    const { measurementSystem, weightUnitLabel, lengthUnitLabel } = useWeightFormatter()
    const [formData, setFormData] = useState({
        weightKg: '',
        lengthCm: '',
        widthCm: '',
        heightCm: '',
    })

    useEffect(() => {
        if(!open || !item) {
            return
        }

        setFormData({
            weightKg: String(item?.weight?.weightKg ?? ''),
            lengthCm: String(item?.dimensions?.lengthCm ?? ''),
            widthCm: String(item?.dimensions?.widthCm ?? ''),
            heightCm: String(item?.dimensions?.heightCm ?? ''),
        })
    }, [open, item])

    const getDisplayWeight = (rawKgValue) => {
        const numericKgValue = Number(rawKgValue)

        if(!Number.isFinite(numericKgValue) || numericKgValue <= 0) {
            return ''
        }

        return String(Number(convertWeightFromKg(numericKgValue, measurementSystem).toFixed(2)))
    }

    const getDisplayLength = (rawCmValue) => {
        const numericCmValue = Number(rawCmValue)

        if(!Number.isFinite(numericCmValue) || numericCmValue <= 0) {
            return ''
        }

        return String(Number(convertLengthFromCm(numericCmValue, measurementSystem).toFixed(2)))
    }

    const updateWeightFromDisplay = (displayValue) => {
        setFormData((prev) => {
            if(displayValue === '') {
                return { ...prev, weightKg: '' }
            }

            const numericDisplayValue = Number(displayValue)

            if(!Number.isFinite(numericDisplayValue) || numericDisplayValue <= 0) {
                return { ...prev, weightKg: displayValue }
            }

            const rawKgValue = convertWeightToKg(numericDisplayValue, measurementSystem)
            return {
                ...prev,
                weightKg: String(Number(rawKgValue.toFixed(4))),
            }
        })
    }

    const updateLengthFromDisplay = (field, displayValue) => {
        setFormData((prev) => {
            if(displayValue === '') {
                return { ...prev, [field]: '' }
            }

            const numericDisplayValue = Number(displayValue)

            if(!Number.isFinite(numericDisplayValue) || numericDisplayValue <= 0) {
                return { ...prev, [field]: displayValue }
            }

            const rawCmValue = convertLengthToCm(numericDisplayValue, measurementSystem)
            return {
                ...prev,
                [field]: String(Number(rawCmValue.toFixed(4))),
            }
        })
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        const payload = {
            weightKg: Number(formData.weightKg),
            lengthCm: Number(formData.lengthCm),
            widthCm: Number(formData.widthCm),
            heightCm: Number(formData.heightCm),
        }

        await onSubmit?.(payload)
    }

    const hasInvalid = [
        Number(formData.weightKg),
        Number(formData.lengthCm),
        Number(formData.widthCm),
        Number(formData.heightCm),
    ].some((value) => !Number.isFinite(value) || value <= 0)

    const isWeightLow = hasLowConfidence(item?.weight?.confidence)
    const isDimensionsLow = hasLowConfidence(item?.dimensions?.confidence)

    return (
        <BaseModal
            open={open}
            onClose={onClose}
            title={`Edit ${item?.name ?? 'item'} metrics`}
            footer={(
                <div className='flex items-center gap-3'>
                    <Button variant='secondary' className='flex-1' onClick={onClose} disabled={saving}>
                        Close
                    </Button>
                    <Button type='submit' className='flex-1' form='edit-item-metrics-form' loading={saving} disabled={saving || hasInvalid}>
                        Save
                    </Button>
                </div>
            )}
        >
            <form id='edit-item-metrics-form' className='flex flex-col gap-3' onSubmit={handleSubmit}>
                <Input
                    label={`Weight (${weightUnitLabel})`}
                    id='weightKg'
                    type='number'
                    min='0.01'
                    step='0.01'
                    value={getDisplayWeight(formData.weightKg)}
                    onChange={(event) => updateWeightFromDisplay(event.target.value)}
                    className={isWeightLow ? 'border-negative1! ring-2 ring-negative2' : ''}
                />

                <div className='grid gap-3 sm:grid-cols-3'>
                    <Input
                        label={`Length (${lengthUnitLabel})`}
                        id='lengthCm'
                        type='number'
                        min='0.01'
                        step='0.01'
                        value={getDisplayLength(formData.lengthCm)}
                        onChange={(event) => updateLengthFromDisplay('lengthCm', event.target.value)}
                        className={isDimensionsLow ? 'border-negative1! ring-2 ring-negative2' : ''}
                    />

                    <Input
                        label={`Width (${lengthUnitLabel})`}
                        id='widthCm'
                        type='number'
                        min='0.01'
                        step='0.01'
                        value={getDisplayLength(formData.widthCm)}
                        onChange={(event) => updateLengthFromDisplay('widthCm', event.target.value)}
                        className={isDimensionsLow ? 'border-negative1! ring-2 ring-negative2' : ''}
                    />

                    <Input
                        label={`Height (${lengthUnitLabel})`}
                        id='heightCm'
                        type='number'
                        min='0.01'
                        step='0.01'
                        value={getDisplayLength(formData.heightCm)}
                        onChange={(event) => updateLengthFromDisplay('heightCm', event.target.value)}
                        className={isDimensionsLow ? 'border-negative1! ring-2 ring-negative2' : ''}
                    />
                </div>

                {error ? <p className='text-sm text-negative1'>{error.message}</p> : null}
            </form>
        </BaseModal>
    )
}

export default EditItemModal
