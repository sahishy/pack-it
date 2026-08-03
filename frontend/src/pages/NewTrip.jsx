import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Check, Plane, Sparkles } from 'lucide-react'
import FormInput from '@/components/common/FormInput'
import DateRangeSelector from '@/components/common/DateRangeSelector'
import Select from '@/components/common/FormSelect'
import Counter from '@/components/common/Counter'
import CommandPalette from '@/components/common/CommandPalette'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useTrips } from '../contexts/TripsContext'
import { getAirlineDisplayById, searchAirlines } from '../utils/airlineUtils'
import { DEFAULT_LIMITS, FLIGHT_CLASS_OPTIONS, TRIP_PURPOSE_OPTIONS } from '../utils/tripUtils'
import useWeightFormatter from '../hooks/useWeightFormatter'
import { convertWeightFromKg, convertWeightToKg } from '../utils/measurementUtils'

const steps = [
    { title: 'Where and when?', description: 'Start with the essentials for your itinerary.', icon: CalendarDays },
    { title: 'What kind of trip?', description: 'This helps tailor future packing suggestions.', icon: Sparkles },
    { title: 'Flight details', description: 'Optional details make weight guidance more accurate.', icon: Plane },
]

const NewTrip = () => {
    const navigate = useNavigate()
    const { addTrip, creating, createError } = useTrips()
    const [step, setStep] = useState(0)
    const [formData, setFormData] = useState({ destination: '', startDate: '', endDate: '', tripPurpose: '', airline: '', flightClass: '', baggageLimit: 1 })
    const [error, setError] = useState('')
    const [isAirlinePaletteOpen, setIsAirlinePaletteOpen] = useState(false)
    const [airlineQuery, setAirlineQuery] = useState('')
    const { weightUnitLabel, measurementSystem } = useWeightFormatter()
    const selectedAirline = useMemo(() => getAirlineDisplayById(formData.airline), [formData.airline])
    const filteredAirlines = useMemo(() => searchAirlines(airlineQuery).slice(0, 200), [airlineQuery])
    const StepIcon = steps[step].icon

    const handleNext = () => {
        setError('')
        if (step === 0 && !formData.destination.trim()) {
            setError('Add a destination to continue.')
            return
        }
        if (step === 0 && formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
            setError('The end date cannot be before the start date.')
            return
        }
        if (step === 1 && Number(formData.baggageLimit) <= 0) {
            setError('Baggage limit must be greater than 0.')
            return
        }
        setStep((current) => Math.min(current + 1, steps.length - 1))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (step < steps.length - 1) {
            handleNext()
            return
        }
        if (creating) return
        try {
            setError('')
            await addTrip({ ...formData, baggageLimit: convertWeightToKg(formData.baggageLimit, measurementSystem) })
            navigate('/home')
        } catch {
            setError('Unable to create this trip right now. Please try again.')
        }
    }

    return (
        <main className='min-h-full'>
            <Dialog open onOpenChange={(open) => { if (!open && !creating) navigate('/home') }}>
                <DialogContent className='sm:max-w-xl'>
                    <DialogHeader className='pr-8'>
                        <div className='mb-2 flex size-10 items-center justify-center rounded-lg bg-muted'><StepIcon className='size-5' /></div>
                        <DialogTitle className='text-xl'>{steps[step].title}</DialogTitle>
                        <DialogDescription>{steps[step].description}</DialogDescription>
                    </DialogHeader>

                    <div className='space-y-2'>
                        <div className='flex items-center justify-between text-xs text-muted-foreground'><span>Step {step + 1} of {steps.length}</span><span>{Math.round(((step + 1) / steps.length) * 100)}%</span></div>
                        <Progress value={((step + 1) / steps.length) * 100} />
                    </div>

                    <form id='new-trip-form' onSubmit={handleSubmit} className='min-h-52 space-y-4 py-2' aria-busy={creating}>
                        <fieldset disabled={creating} className='space-y-4'>
                            {step === 0 ? (
                                <>
                                    <FormInput label='Destination' name='destination' placeholder='e.g. Lisbon, Portugal' value={formData.destination} onChange={(event) => setFormData((previous) => ({ ...previous, destination: event.target.value }))} />
                                    <DateRangeSelector label='Trip dates' id='tripDates' startDate={formData.startDate} endDate={formData.endDate} onChange={({ startDate, endDate }) => setFormData((previous) => ({ ...previous, startDate, endDate }))} />
                                </>
                            ) : null}

                            {step === 1 ? (
                                <>
                                    <Select label='Trip purpose' id='tripPurpose' value={formData.tripPurpose} onChange={(tripPurpose) => setFormData((previous) => ({ ...previous, tripPurpose }))} options={TRIP_PURPOSE_OPTIONS} placeholder='Select a purpose' />
                                    <Counter label={`Baggage limit (${weightUnitLabel})`} id='baggageLimit' value={formData.baggageLimit} onChange={(baggageLimit) => setFormData((previous) => ({ ...previous, baggageLimit }))} min={1} allowDecimal step={0.01} />
                                </>
                            ) : null}

                            {step === 2 ? (
                                <>
                                    <div>
                                        <label htmlFor='airline' className='text-sm font-medium'>Airline</label>
                                        <button id='airline' type='button' onClick={() => { setAirlineQuery(selectedAirline?.name ?? ''); setIsAirlinePaletteOpen(true) }} className='mt-1 flex min-h-10 w-full items-center gap-3 rounded-lg border bg-background px-3 py-2 text-left text-sm shadow-xs transition hover:bg-accent'>
                                            {selectedAirline?.logo ? <img src={selectedAirline.logo} alt='' className='size-6 rounded object-cover' /> : <Plane className='size-4 text-muted-foreground' />}
                                            <span className={selectedAirline?.name ? '' : 'text-muted-foreground'}>{selectedAirline?.name || 'Select an airline'}</span>
                                        </button>
                                    </div>
                                    <Select label='Flight class' id='flightClass' value={formData.flightClass} onChange={(flightClass) => setFormData((previous) => {
                                        const defaultLimitKg = DEFAULT_LIMITS[flightClass]
                                        const baggageLimit = Number(previous.baggageLimit) === 1 && Number.isFinite(defaultLimitKg) ? convertWeightFromKg(defaultLimitKg, measurementSystem) : previous.baggageLimit
                                        return { ...previous, flightClass, baggageLimit }
                                    })} options={FLIGHT_CLASS_OPTIONS} placeholder='Select a flight class' />
                                </>
                            ) : null}
                        </fieldset>

                        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
                        {createError ? <p className='text-sm text-destructive'>{createError.message}</p> : null}
                    </form>

                    <DialogFooter>
                        {step > 0 ? <Button type='button' variant='outline' disabled={creating} onClick={() => { setError(''); setStep((current) => current - 1) }}>Back</Button> : null}
                        <Button type='submit' form='new-trip-form' loading={creating}>{step === steps.length - 1 ? <><Check className='size-4' /> Create trip</> : <>Continue</>}</Button>
                    </DialogFooter>

                    <CommandPalette open={isAirlinePaletteOpen} onClose={() => setIsAirlinePaletteOpen(false)} query={airlineQuery} onQueryChange={setAirlineQuery} items={filteredAirlines} title='Select airline' placeholder='Search airlines by name' emptyMessage='No airlines found.' onSelect={(airline) => { setFormData((previous) => ({ ...previous, airline: airline.id })); setIsAirlinePaletteOpen(false); setAirlineQuery('') }} />
                </DialogContent>
            </Dialog>
        </main>
    )
}

export default NewTrip
