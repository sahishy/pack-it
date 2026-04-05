import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaSuitcaseRolling } from 'react-icons/fa6'
import { FiAlertTriangle, FiUploadCloud } from 'react-icons/fi'
import Topbar from '../components/ui/Topbar'
import Return from '../components/ui/Return'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { useSuitcases } from '../contexts/SuitcasesContext'
import { hasLowSuitcaseConfidence } from '../utils/suitcaseUtils'
import useWeightFormatter from '../hooks/useWeightFormatter'
import { convertLengthFromCm, convertLengthToCm } from '../utils/measurementUtils'

const NewSuitcase = () => {
    const navigate = useNavigate()
    const { user, profile, logout } = useAuth()
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

    const displayName = profile?.firstName ? `${profile.firstName} ${profile?.lastName ?? ''}`.trim() : user?.email
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
        <main className='min-h-screen bg-neutral5'>
            <Topbar displayName={displayName} email={user?.email} onLogout={logout} />

            <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10'>
                <Return text='Back to suitcases' link='/suitcases' />

                <Card>
                    <div className='flex flex-col items-center gap-3'>
                        <div className='rounded-full bg-linear-to-t from-primary0 to-primary1 p-4'>
                            <FaSuitcaseRolling className='text-3xl text-white' />
                        </div>

                        <div>
                            <h1 className='text-center text-3xl font-semibold text-neutral0'>Add new suitcase</h1>
                            <p className='mt-1 text-center text-sm text-neutral1'>Use AI autofill from a photo or enter details manually.</p>
                        </div>
                    </div>

                    <form className='mt-6 flex flex-col gap-4' onSubmit={handleSubmit}>
                        <div className='flex justify-center my-6'>
                            <label className='flex cursor-pointer items-center gap-2 rounded-xl border border-neutral2 bg-neutral5 px-3 py-2 text-sm text-neutral1 transition hover:bg-neutral4'>
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
                            <hr className='w-full border-neutral3'></hr>
                            <p className='text-center text-sm text-neutral1 font-medium'>or</p>
                            <hr className='w-full border-neutral3'></hr>
                        </div>

                        <Input
                            label='Suitcase name'
                            id='suitcaseName'
                            value={formData.name}
                            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                            placeholder="e.g. John's Suitcase"
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
                            />
                            <Input
                                label={`Width (${lengthUnitLabel})`}
                                id='widthCm'
                                type='number'
                                min='0.01'
                                step='0.01'
                                value={getDisplayLength(formData.widthCm)}
                                onChange={(event) => updateLengthFromDisplay('widthCm', event.target.value)}
                            />
                            <Input
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
                            <p className='inline-flex items-center gap-2 text-sm text-warning1'>
                                <FiAlertTriangle />
                                AI confidence is low for {isLowNameConfidence ? 'name' : ''}{isLowNameConfidence && isLowDimensionsConfidence ? ' and ' : ''}{isLowDimensionsConfidence ? 'dimensions' : ''}. Please verify before saving.
                            </p>
                        ) : null}

                        {formError ? <p className='text-sm text-negative1'>{formError}</p> : null}
                        {visionError ? <p className='text-sm text-negative1'>{visionError.message}</p> : null}
                        {saveError ? <p className='text-sm text-negative1'>{saveError.message}</p> : null}

                        <Button type='submit' loading={saving} disabled={saving || visionLoading} className='mt-3'>
                            Save suitcase
                        </Button>
                    </form>
                </Card>
            </div>
        </main>
    )
}

export default NewSuitcase
