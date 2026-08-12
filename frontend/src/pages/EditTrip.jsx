import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import FormInput from '@/components/common/FormInput'
import DateRangeSelector from '@/components/common/DateRangeSelector'
import { Button } from '@/components/ui/button'
import Select from '@/components/common/FormSelect'
import { Counter } from '@/components/ui/counter'
import CommandPalette from '@/components/common/CommandPalette'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripsContext'
import { getAirlineDisplayById, searchAirlines } from '../utils/airlineUtils'
import { FLIGHT_CLASS_OPTIONS, getTripById, TRIP_PURPOSE_OPTIONS } from '../utils/tripUtils'
import LoadingScreen from '@/components/common/LoadingScreen'
import ErrorScreen from '@/components/common/ErrorScreen'
import useWeightFormatter from '../hooks/useWeightFormatter'
import { convertWeightToKg } from '../utils/measurementUtils'

const EditTrip = () => {
    const navigate = useNavigate()
    const { tripId } = useParams()
    const { user } = useAuth()
    const {
        trips,
        loading: tripsLoading,
        error: tripsError,
        editTrip,
        updating,
        updateError,
    } = useTrips()

    const trip = useMemo(() => getTripById(trips, tripId), [trips, tripId])
    const [error, setError] = useState('')
    const [isAirlinePaletteOpen, setIsAirlinePaletteOpen] = useState(false)
    const [airlineQuery, setAirlineQuery] = useState('')
    const { weightUnitLabel, measurementSystem, formatWeightValue } = useWeightFormatter()
    const [formData, setFormData] = useState(() => ({
        destination: '',
        startDate: '',
        endDate: '',
        tripPurpose: '',
        airline: '',
        flightClass: '',
        baggageLimit: '',
    }))

    useEffect(() => {
        if (!trip) {
            return
        }

        setFormData({
            destination: trip.destination ?? '',
            startDate: trip.startDate ?? '',
            endDate: trip.endDate ?? '',
            tripPurpose: trip.tripPurpose ?? '',
            airline: trip.airline ?? '',
            flightClass: trip.flightClass ?? '',
            baggageLimit: formatWeightValue(trip.baggageLimit ?? '', { decimals: 2 }),
        })
    }, [formatWeightValue, measurementSystem, trip])

    const selectedAirline = useMemo(() => getAirlineDisplayById(formData.airline), [formData.airline])
    const filteredAirlines = useMemo(() => searchAirlines(airlineQuery).slice(0, 200), [airlineQuery])

    const requiredFields = [
        'destination',
        'startDate',
        'endDate',
        'tripPurpose',
        'baggageLimit',
    ]

    const requiredFieldsForDisable = [
        'destination',
        'startDate',
        'endDate',
        'tripPurpose',
    ]

    const hasMissingRequiredField = requiredFieldsForDisable.some((fieldName) => {
        const fieldValue = formData[fieldName]

        if (typeof fieldValue === 'string') {
            return !fieldValue.trim()
        }

        return !fieldValue
    })

    const handleChange = (event) => {
        const { name, value } = event.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')

        const hasEmpty = requiredFields.some((fieldName) => !formData[fieldName])
        if (hasEmpty) {
            setError('Please fill in Destination, Start Date, End Date, Trip Purpose, and Baggage Limit.')
            return
        }

        if (Number(formData.baggageLimit) <= 0) {
            setError('Baggage limit must be greater than 0.')
            return
        }

        if (formData.endDate < formData.startDate) {
            setError('End date cannot be before start date.')
            return
        }

        try {
            await editTrip(tripId, {
                ...formData,
                baggageLimit: convertWeightToKg(formData.baggageLimit, measurementSystem),
            })
            navigate(`/trips/${tripId}`)
        } catch {
            setError('Unable to update trip right now. Please try again.')
        }
    }

    if (!user) {
        return <Navigate to='/login' replace />
    }

    if (tripsLoading) {
        return <LoadingScreen text='Loading trip...' />
    }

    if (tripsError || !trip) {
        return <ErrorScreen text='Trip not found.' />
    }

    const requiredAsterisk = <span className='text-destructive'>*</span>

    return (
        <main className='min-h-full'>
            <Dialog open onOpenChange={(open) => { if (!open && !updating) navigate(`/trips/${tripId}`) }}>
                <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-2xl'>
                    <DialogHeader className='pr-8'>
                        <DialogTitle className='text-xl'>Edit trip</DialogTitle>
                        <DialogDescription>Update the itinerary and baggage details for this trip.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className='mt-6 grid gap-4'>
                        <FormInput
                            label={<><span>Destination </span>{requiredAsterisk}</>}
                            name='destination'
                            placeholder='e.g. Paris, France'
                            value={formData.destination}
                            onChange={handleChange}
                        />

                        <DateRangeSelector
                            label={<><span>Trip dates </span>{requiredAsterisk}</>}
                            id='tripDates'
                            startDate={formData.startDate}
                            endDate={formData.endDate}
                            onChange={({ startDate, endDate }) => {
                                setFormData((prev) => ({ ...prev, startDate, endDate }))
                            }}
                        />

                        <div className='flex flex-col gap-4 lg:flex-row'>
                            <Select
                                label={<><span>Trip Purpose </span>{requiredAsterisk}</>}
                                id='tripPurpose'
                                containerClassName='flex-1'
                                value={formData.tripPurpose}
                                onChange={(tripPurpose) => setFormData((prev) => ({ ...prev, tripPurpose }))}
                                options={TRIP_PURPOSE_OPTIONS}
                                placeholder='Select trip purpose'
                            />
                            <Counter
                                label={<><span>Baggage Limit ({weightUnitLabel}) </span>{requiredAsterisk}</>}
                                id='baggageLimit'
                                value={formData.baggageLimit}
                                containerClassName='flex-1'
                                onChange={(baggageLimit) => setFormData((prev) => ({ ...prev, baggageLimit }))}
                                min={1}
                                allowDecimal
                                step={0.01}
                            />
                        </div>

                        <div className='flex flex-col gap-4 lg:flex-row'>
                            <div className='flex-1'>
                                <label htmlFor='airline' className='text-sm font-medium'>
                                    Airline
                                </label>

                                <button
                                    id='airline'
                                    type='button'
                                    onClick={() => {
                                        setAirlineQuery(selectedAirline?.name ?? '')
                                        setIsAirlinePaletteOpen(true)
                                    }}
                                    className='mt-1 flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm shadow-xs transition hover:bg-accent'
                                >
                                    {selectedAirline?.logo ? (
                                        <img
                                            src={selectedAirline.logo}
                                            alt={`${selectedAirline.name} logo`}
                                            className='h-6 w-6 rounded object-cover'
                                        />
                                    ) : null}

                                    <span className={selectedAirline?.name ? '' : 'text-muted-foreground'}>
                                        {selectedAirline?.name || 'Select an airline'}
                                    </span>
                                </button>
                            </div>

                            <Select
                                label='Flight Class'
                                id='flightClass'
                                containerClassName='flex-1'
                                value={formData.flightClass}
                                onChange={(flightClass) => setFormData((prev) => ({ ...prev, flightClass }))}
                                options={FLIGHT_CLASS_OPTIONS}
                                placeholder='Select flight class'
                            />
                        </div>

                        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
                        {updateError ? <p className='text-sm text-destructive'>{updateError.message}</p> : null}

                        <Button type='submit' loading={updating} disabled={hasMissingRequiredField} className='mt-3'>
                            Save changes
                        </Button>
                    </form>

                    <CommandPalette
                        open={isAirlinePaletteOpen}
                        onClose={() => setIsAirlinePaletteOpen(false)}
                        query={airlineQuery}
                        onQueryChange={setAirlineQuery}
                        items={filteredAirlines}
                        title='Select airline'
                        placeholder='Search airlines by name'
                        emptyMessage='No airlines found.'
                        onSelect={(airline) => {
                            setFormData((prev) => ({ ...prev, airline: airline.id }))
                            setIsAirlinePaletteOpen(false)
                            setAirlineQuery('')
                        }}
                    />
                </DialogContent>
            </Dialog>
        </main>
    )
}

export default EditTrip
