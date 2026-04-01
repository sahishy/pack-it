import { useEffect, useMemo, useState } from 'react'
import { FaCircleCheck, FaCircleExclamation } from 'react-icons/fa6'
import Card from '../../components/ui/Card'
import Return from '../../components/ui/Return'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import {
    getDefaultEmergencyInfo,
    getEmergencyInfo,
    saveEmergencyInfo,
} from '../../services/tools/emergencyInfoService'

const TEXTAREA_BASE_CLASS = 'w-full rounded-xl border border-neutral2 bg-neutral5 px-3 py-2.5 text-sm text-neutral0 outline-none transition placeholder:text-neutral1 focus:border-neutral1 focus:ring-2 focus:ring-neutral3'

const EmergencyInfo = () => {
    const [formValues, setFormValues] = useState(() => getDefaultEmergencyInfo())
    const [saveState, setSaveState] = useState('idle')

    const isSaveSuccess = useMemo(() => saveState === 'saved', [saveState])
    const isSaveError = useMemo(() => saveState === 'error', [saveState])

    useEffect(() => {
        const storedValues = getEmergencyInfo()
        setFormValues(storedValues)
    }, [])

    const updateField = (field, value) => {
        setSaveState('idle')
        setFormValues((previous) => ({
            ...previous,
            [field]: value,
        }))
    }

    const handleSave = () => {
        try {
            saveEmergencyInfo(formValues)
            setSaveState('saved')
        } catch {
            setSaveState('error')
        }
    }

    return (
        <main className='min-h-screen'>
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10'>
                <Return link='/tools' text='Back to Tools' />

                <div className='mb-2'>
                    <h1 className='text-4xl font-bold text-neutral0'>Emergency Info</h1>
                    <p className='mt-1 text-sm text-neutral1'>Store critical personal details for travel emergencies.</p>
                </div>

                <Card className='border-none bg-linear-to-r from-[#ff5f4a] to-[#ff8a00] text-neutral5'>
                    <div className='flex items-start gap-4'>
                        <div className='pt-1'>
                            <FaCircleExclamation className='text-3xl text-neutral5' />
                        </div>

                        <div className='flex flex-col gap-2'>
                            <h2 className='text-xl font-semibold text-neutral5'>Critical Information</h2>
                            <p className='text-sm leading-relaxed text-neutral5/95'>
                                This information stays on your device and can be accessed offline. Keep it updated for emergencies during travel.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className='flex flex-col gap-4'>
                    <h2 className='text-sm font-medium text-neutral0'>Emergency Details</h2>

                    <Input
                        id='passportNumber'
                        label='Passport Number'
                        value={formValues.passportNumber}
                        onChange={(event) => updateField('passportNumber', event.target.value)}
                        placeholder='Enter passport number'
                    />

                    <Input
                        id='bloodType'
                        label='Blood Type'
                        value={formValues.bloodType}
                        onChange={(event) => updateField('bloodType', event.target.value)}
                        placeholder='e.g. O+, A-, AB+'
                    />

                    <Input
                        id='emergencyContactName'
                        label='Emergency Contact Name'
                        value={formValues.emergencyContactName}
                        onChange={(event) => updateField('emergencyContactName', event.target.value)}
                        placeholder='Enter full name'
                    />

                    <Input
                        id='emergencyContactPhone'
                        label='Emergency Contact Phone'
                        value={formValues.emergencyContactPhone}
                        onChange={(event) => updateField('emergencyContactPhone', event.target.value)}
                        placeholder='Enter phone number'
                    />

                    <div className='flex flex-col gap-1'>
                        <label htmlFor='localEmbassyAddress' className='text-sm font-medium text-neutral0'>
                            Local Embassy Address
                        </label>
                        <textarea
                            id='localEmbassyAddress'
                            rows={3}
                            className={TEXTAREA_BASE_CLASS}
                            value={formValues.localEmbassyAddress}
                            onChange={(event) => updateField('localEmbassyAddress', event.target.value)}
                            placeholder='Enter embassy address and contact details'
                        />
                    </div>

                    <div className='flex flex-col gap-1'>
                        <label htmlFor='travelInsuranceDetails' className='text-sm font-medium text-neutral0'>
                            Travel Insurance Details
                        </label>
                        <textarea
                            id='travelInsuranceDetails'
                            rows={3}
                            className={TEXTAREA_BASE_CLASS}
                            value={formValues.travelInsuranceDetails}
                            onChange={(event) => updateField('travelInsuranceDetails', event.target.value)}
                            placeholder='Provider, policy number, and support contact'
                        />
                    </div>

                    <div className='flex flex-col gap-1'>
                        <label htmlFor='medicalAllergiesConditions' className='text-sm font-medium text-neutral0'>
                            Medical Allergies / Conditions
                        </label>
                        <textarea
                            id='medicalAllergiesConditions'
                            rows={3}
                            className={TEXTAREA_BASE_CLASS}
                            value={formValues.medicalAllergiesConditions}
                            onChange={(event) => updateField('medicalAllergiesConditions', event.target.value)}
                            placeholder='List allergies, conditions, medications, or special care notes'
                        />
                    </div>

                    <div className='flex flex-col gap-1'>
                        <label htmlFor='additionalNotes' className='text-sm font-medium text-neutral0'>
                            Additional Notes
                        </label>
                        <textarea
                            id='additionalNotes'
                            rows={3}
                            className={TEXTAREA_BASE_CLASS}
                            value={formValues.additionalNotes}
                            onChange={(event) => updateField('additionalNotes', event.target.value)}
                            placeholder='Add anything else important for emergencies'
                        />
                    </div>

                    {isSaveSuccess ? (
                        <p className='inline-flex items-center gap-2 text-sm text-positive1'>
                            <FaCircleCheck />
                            Saved locally on this device.
                        </p>
                    ) : null}

                    {isSaveError ? (
                        <p className='text-sm text-negative1'>Could not save emergency info. Please try again.</p>
                    ) : null}

                    <Button variant='secondary' className='w-full' onClick={handleSave}>
                        Save Emergency Info
                    </Button>
                </Card>
            </div>
        </main>
    )
}

export default EmergencyInfo