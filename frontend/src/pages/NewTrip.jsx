import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, Plane, Sparkles } from 'lucide-react'
import FormInput from '@/components/common/FormInput'
import DateRangeSelector from '@/components/common/DateRangeSelector'
import Select from '@/components/common/FormSelect'
import { Counter } from '@/components/ui/counter'
import CommandPalette from '@/components/common/CommandPalette'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useTrips } from '../contexts/TripsContext'
import { getAirlineDisplayById, searchAirlines } from '../utils/airlineUtils'
import { DEFAULT_LIMITS, FLIGHT_CLASS_OPTIONS, TRIP_PURPOSE_OPTIONS } from '../utils/tripUtils'
import useWeightFormatter from '../hooks/useWeightFormatter'
import { convertWeightFromKg, convertWeightToKg } from '../utils/measurementUtils'
import DestinationImage1 from '@/assets/images/destinationImg1.jpg'
import DestinationImage2 from '@/assets/images/destinationImg2.jpg'
import DestinationImage3 from '@/assets/images/destinationImg3.jpg'
import TravelImage1 from '@/assets/images/travelImg1.jpg'
import TravelImage2 from '@/assets/images/travelImg2.jpg'
import TravelImage3 from '@/assets/images/travelImg3.jpg'
import FlightImage1 from '@/assets/images/flightImg1.jpg'
import FlightImage2 from '@/assets/images/flightImg2.jpg'
import FlightImage3 from '@/assets/images/flightImg3.jpg'

const steps = [
    { title: 'Where and when?', description: 'Start with the essentials for your itinerary.', icon: CalendarDays },
    { title: 'What kind of trip?', description: 'This helps tailor future packing suggestions.', icon: Sparkles },
    { title: 'Flight details', description: 'Optional details make weight guidance more accurate.', icon: Plane },
]

const stepImages = [
    [DestinationImage1, DestinationImage2, DestinationImage3],
    [TravelImage1, TravelImage2, TravelImage3],
    [FlightImage1, FlightImage2, FlightImage3],
]

const StepVisual = ({ step }) => {
    const [activeImage, setActiveImage] = useState(0)
    const images = stepImages[step]

    useEffect(() => {
        const interval = window.setInterval(() => {
            setActiveImage((current) => (current + 1) % images.length)
        }, 6500)

        return () => window.clearInterval(interval)
    }, [images.length])

    return (
        <aside className='relative min-h-72 lg:min-h-full'>
            {images.map((image, index) => (
                <img
                    key={image}
                    src={image}
                    alt=''
                    aria-hidden='true'
                    className={`absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] rounded-xl object-cover brightness-75 transition-opacity duration-700 ease-in-out ${activeImage === index ? 'opacity-100' : 'opacity-0'}`}
                />
            ))}
            <div aria-hidden='true' className='pointer-events-none absolute right-0 top-0 z-10 size-12 rounded-bl-xl bg-popover' />
        </aside>
    )
}

const NewTrip = ({ open, onClose }) => {
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
            onClose?.()
        } catch {
            setError('Unable to create this trip right now. Please try again.')
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !creating) onClose?.() }}>
                <DialogContent className='!block w-[calc(100%-2rem)] max-w-5xl! overflow-hidden p-0! sm:w-[min(100%-4rem,62rem)]' closeButtonClassName='z-20'>
                    <div className='grid min-h-[34rem] md:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]'>
                        <div className='flex min-w-0 flex-col p-6 sm:p-8'>
                            <DialogHeader className='pr-10'>
                                <div className='mb-2 flex size-10 items-center justify-center rounded-lg bg-muted'><StepIcon className='size-5' /></div>
                                <DialogTitle className='text-xl'>{steps[step].title}</DialogTitle>
                                <DialogDescription>{steps[step].description}</DialogDescription>
                            </DialogHeader>

                            <form id='new-trip-form' onSubmit={handleSubmit} className='min-h-52 flex-1 space-y-4 py-6' aria-busy={creating}>
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
                                    <Counter label={`Baggage limit (${weightUnitLabel})`} id='baggageLimit' value={formData.baggageLimit} onChange={(baggageLimit) => setFormData((previous) => ({ ...previous, baggageLimit }))} min={1} allowDecimal step={1} />
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

                            <DialogFooter className='!mx-0 !mb-0 !flex-row !items-center !justify-between !border-0 !bg-transparent !p-0 !pt-5'>
                                <div className='flex flex-col items-start gap-1.5'>
                                    <span className='text-xs text-muted-foreground'>Step {step + 1} of {steps.length}</span>
                                    <Progress value={((step + 1) / steps.length) * 100} aria-label={`Step ${step + 1} of ${steps.length}`} className='w-16 gap-0 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-neutral3 [&_[data-slot=progress-indicator]]:bg-neutral1' />
                                </div>
                                <div className='flex items-center gap-2'>
                                    {step > 0 ? <Button type='button' variant='outline' disabled={creating} onClick={() => { setError(''); setStep((current) => current - 1) }}>Back</Button> : null}
                                    <Button type='submit' form='new-trip-form' loading={creating}>{step === steps.length - 1 ? <><Check className='size-4' /> Create trip</> : <>Continue</>}</Button>
                                </div>
                            </DialogFooter>
                        </div>
                        <StepVisual key={step} step={step} />
                    </div>
                </DialogContent>
            </Dialog>
            <CommandPalette open={isAirlinePaletteOpen} onClose={() => setIsAirlinePaletteOpen(false)} query={airlineQuery} onQueryChange={setAirlineQuery} items={filteredAirlines} title='Select airline' placeholder='Search airlines by name' emptyMessage='No airlines found.' onSelect={(airline) => { setFormData((previous) => ({ ...previous, airline: airline.id })); setIsAirlinePaletteOpen(false); setAirlineQuery('') }} />
        </>
    )
}

export default NewTrip
