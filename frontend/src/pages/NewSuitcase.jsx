import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiAlertTriangle, FiUploadCloud } from 'react-icons/fi'
import { Luggage } from 'lucide-react'
import FormInput from '@/components/common/FormInput'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSuitcases } from '../contexts/SuitcasesContext'
import { hasLowSuitcaseConfidence } from '../utils/suitcaseUtils'
import useWeightFormatter from '../hooks/useWeightFormatter'
import { convertLengthFromCm, convertLengthToCm } from '../utils/measurementUtils'

const NewSuitcase = () => {
    const navigate = useNavigate()
    const {
        addSuitcase,
        saving,
        saveError,
        visionLoading,
        visionError,
        runSuitcaseVision,
    } = useSuitcases()

    const [formData, setFormData] = useState({
        name: '',
        lengthCm: '',
        widthCm: '',
        heightCm: '',
    })
    const [formError, setFormError] = useState('')
    const [predictionConfidence, setPredictionConfidence] = useState(null)
    const { measurementSystem, lengthUnitLabel } = useWeightFormatter()

    const isLowNameConfidence = hasLowSuitcaseConfidence(predictionConfidence?.confidenceName)
    const isLowDimensionsConfidence = hasLowSuitcaseConfidence(predictionConfidence?.confidenceDimensions)

    const getDisplayLength = (rawCmValue) => {
        const numericCmValue = Number(rawCmValue)

        if(!Number.isFinite(numericCmValue) || numericCmValue <= 0) {
            return ''
        }

        return String(Number(convertLengthFromCm(numericCmValue, measurementSystem).toFixed(2)))
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

    const handleAnalyzeImage = async (event) => {
        const file = event.target.files?.[0]

        if (!file) {
            return
        }

        try {
            setFormError('')
            const prediction = await runSuitcaseVision({ file })

            if (!prediction?.success) {
                setPredictionConfidence(null)
                setFormError('AI could not confidently detect suitcase details. Please fill them manually.')
                return
            }

            setFormData((prev) => ({
                ...prev,
                name: prediction?.name || prev.name,
                lengthCm: String(prediction?.dimensions?.lengthCm ?? prev.lengthCm),
                widthCm: String(prediction?.dimensions?.widthCm ?? prev.widthCm),
                heightCm: String(prediction?.dimensions?.heightCm ?? prev.heightCm),
            }))

            setPredictionConfidence({
                confidenceName: prediction?.confidenceName,
                confidenceDimensions: prediction?.confidenceDimensions,
            })
        } catch (errorValue) {
            setPredictionConfidence(null)
            setFormError(errorValue?.message ?? 'Failed to analyze image.')
        } finally {
            event.target.value = ''
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        const payload = {
            name: formData.name.trim(),
            dimensions: {
                lengthCm: Number(formData.lengthCm),
                widthCm: Number(formData.widthCm),
                heightCm: Number(formData.heightCm),
            },
        }

        const hasInvalid = !payload.name
            || !Number.isFinite(payload.dimensions.lengthCm)
            || !Number.isFinite(payload.dimensions.widthCm)
            || !Number.isFinite(payload.dimensions.heightCm)
            || payload.dimensions.lengthCm <= 0
            || payload.dimensions.widthCm <= 0
            || payload.dimensions.heightCm <= 0

        if (hasInvalid) {
            setFormError('Please provide suitcase name and valid dimensions.')
            return
        }

        try {
            setFormError('')
            await addSuitcase(payload, predictionConfidence ?? {})
            navigate('/suitcases')
        } catch (errorValue) {
            setFormError(errorValue?.message ?? 'Failed to save suitcase.')
        }
    }

    return (
        <main className='min-h-full'>
            <Dialog open onOpenChange={(open) => { if (!open && !saving && !visionLoading) navigate('/suitcases') }}>
                <DialogContent className='sm:max-w-xl'>
                    <DialogHeader className='pr-8'>
                        <div className='mb-2 flex size-10 items-center justify-center rounded-lg bg-muted'><Luggage className='size-5' /></div>
                        <DialogTitle className='text-xl'>Add a suitcase</DialogTitle>
                        <DialogDescription>Autofill from a photo or enter the suitcase dimensions manually.</DialogDescription>
                    </DialogHeader>

                    <form className='mt-6 flex flex-col gap-4' onSubmit={handleSubmit}>
                        <div className='flex justify-center py-3'>
                            <label className='flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground shadow-xs transition hover:bg-accent'>
                                <FiUploadCloud />
                                {visionLoading ? 'Analyzing...' : 'Autofill from image'}
                                <input
                                    type='file'
                                    accept='image/*'
                                    className='hidden'
                                    onChange={handleAnalyzeImage}
                                    disabled={visionLoading || saving}
                                />
                            </label>
                        </div>
                        
                        <div className='flex items-center gap-3'>
                            <hr className='w-full border-border'></hr>
                            <p className='text-center text-xs text-muted-foreground'>or enter manually</p>
                            <hr className='w-full border-border'></hr>
                        </div>

                        <FormInput
                            label='Suitcase name'
                            id='suitcaseName'
                            value={formData.name}
                            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                            placeholder="e.g. John's Suitcase"
                        />

                        <div className='grid gap-3 sm:grid-cols-3'>
                            <FormInput
                                label={`Length (${lengthUnitLabel})`}
                                id='lengthCm'
                                type='number'
                                min='0.01'
                                step='0.01'
                                value={getDisplayLength(formData.lengthCm)}
                                onChange={(event) => updateLengthFromDisplay('lengthCm', event.target.value)}
                            />
                            <FormInput
                                label={`Width (${lengthUnitLabel})`}
                                id='widthCm'
                                type='number'
                                min='0.01'
                                step='0.01'
                                value={getDisplayLength(formData.widthCm)}
                                onChange={(event) => updateLengthFromDisplay('widthCm', event.target.value)}
                            />
                            <FormInput
                                label={`Height (${lengthUnitLabel})`}
                                id='heightCm'
                                type='number'
                                min='0.01'
                                step='0.01'
                                value={getDisplayLength(formData.heightCm)}
                                onChange={(event) => updateLengthFromDisplay('heightCm', event.target.value)}
                            />
                        </div>

                        {(isLowNameConfidence || isLowDimensionsConfidence) ? (
                            <p className='inline-flex items-center gap-2 text-sm text-amber-600'>
                                <FiAlertTriangle />
                                AI confidence is low for {isLowNameConfidence ? 'name' : ''}{isLowNameConfidence && isLowDimensionsConfidence ? ' and ' : ''}{isLowDimensionsConfidence ? 'dimensions' : ''}. Please verify before saving.
                            </p>
                        ) : null}

                        {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}
                        {visionError ? <p className='text-sm text-destructive'>{visionError.message}</p> : null}
                        {saveError ? <p className='text-sm text-destructive'>{saveError.message}</p> : null}

                        <Button type='submit' loading={saving} disabled={saving || visionLoading} className='mt-3'>
                            Save suitcase
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    )
}

export default NewSuitcase
