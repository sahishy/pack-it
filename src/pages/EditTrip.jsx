import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import DateSelector from '../components/ui/DateSelector'
import Button from '../components/ui/Button'
import Select from '../components/popover/Select'
import Counter from '../components/popover/Counter'
import CommandPalette from '../components/ui/CommandPalette'
import Topbar from '../components/ui/Topbar'
import Return from '../components/ui/Return'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripsContext'
import { getAirlineDisplayById, searchAirlines } from '../utils/airlineUtils'
import { FLIGHT_CLASS_OPTIONS, getTripById, TRIP_PURPOSE_OPTIONS } from '../utils/tripUtils'
import LoadingScreen from '../components/ui/LoadingScreen'
import ErrorScreen from '../components/ui/ErrorScreen'

const EditTrip = () => {
    const navigate = useNavigate()
    const { tripId } = useParams()
    const { user, profile, logout } = useAuth()
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
    const [formData, setFormData] = useState(() => ({
        destination: '',
        startDate: '',
        endDate: '',
        tripPurpose: '',
        airline: '',
        flightClass: '',
        baggageLimit: '',
    }))

    const displayName = profile?.firstName ? `${profile.firstName} ${profile?.lastName ?? ''}`.trim() : user?.email

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
            baggageLimit: trip.baggageLimit ?? '',
        })
    }, [trip])

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
            await editTrip(tripId, formData)
            navigate(`/trips/${tripId}`)
        } catch {
            setError('Unable to update trip right now. Please try again.')
        }
    }

    if (!user) {
        return <Navigate to='/login' replace />
    }

    if (tripsLoading) {
        return <LoadingScreen text='Loading trip...' className='bg-neutral4' />
    }

    if (tripsError || !trip) {
        return <ErrorScreen text='Trip not found.' className='bg-neutral4' />
    }

    const requiredAsterisk = <span className='text-negative1'>*</span>

    return (
        <main className='min-h-screen'>
            <Topbar displayName={displayName} email={user?.email} onLogout={logout} />

            <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10'>
                <Return text='Back to trip overview' link={`/trips/${tripId}`} />

                <Card>
                    <div>
                        <h1 className='text-center text-3xl font-semibold text-neutral0'>Edit trip</h1>
                        <p className='mt-1 text-center text-sm text-neutral1'>Update your trip details.</p>
                    </div>

                    <form onSubmit={handleSubmit} className='mt-6 grid gap-4'>
                        <Input
                            label={<><span>Destination </span>{requiredAsterisk}</>}
                            name='destination'
                            placeholder='e.g. Paris, France'
                            value={formData.destination}
                            onChange={handleChange}
                        />

                        <div className='flex flex-col gap-4 lg:flex-row'>
                            <DateSelector
                                label={<><span>Start Date </span>{requiredAsterisk}</>}
                                id='startDate'
                                name='startDate'
                                containerClassName='flex-1'
                                value={formData.startDate}
                                onChange={handleChange}
                            />
                            <DateSelector
                                label={<><span>End Date </span>{requiredAsterisk}</>}
                                id='endDate'
                                name='endDate'
                                containerClassName='flex-1'
                                value={formData.endDate}
                                onChange={handleChange}
                            />
                        </div>

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
                                label={<><span>Baggage Limit (kg) </span>{requiredAsterisk}</>}
                                id='baggageLimit'
                                value={formData.baggageLimit}
                                containerClassName='flex-1'
                                onChange={(baggageLimit) => setFormData((prev) => ({ ...prev, baggageLimit }))}
                                min={1}
                            />
                        </div>

                        <div className='flex flex-col gap-4 lg:flex-row'>
                            <div className='flex-1'>
                                <label htmlFor='airline' className='text-sm font-medium text-neutral0'>
                                    Airline
                                </label>

                                <button
                                    id='airline'
                                    type='button'
                                    onClick={() => {
                                        setAirlineQuery(selectedAirline?.name ?? '')
                                        setIsAirlinePaletteOpen(true)
                                    }}
                                    className='mt-1 flex min-h-10.5 w-full cursor-pointer items-center gap-3 rounded-xl border border-neutral2 bg-neutral5 px-3 py-2 text-sm text-neutral0 outline-none transition focus:border-neutral1 focus:ring-2 focus:ring-neutral3'
                                >
                                    {selectedAirline?.logo ? (
                                        <img
                                            src={selectedAirline.logo}
                                            alt={`${selectedAirline.name} logo`}
                                            className='h-6 w-6 rounded object-cover'
                                        />
                                    ) : null}

                                    <span className={selectedAirline?.name ? 'text-neutral0' : 'text-neutral1'}>
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

                        {error ? <p className='text-sm text-negative1'>{error}</p> : null}
                        {updateError ? <p className='text-sm text-negative1'>{updateError.message}</p> : null}

                        <Button type='submit' loading={updating} disabled={hasMissingRequiredField} className='mt-3'>
                            Save Changes
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
                </Card>
            </div>
        </main>
    )
}

export default EditTrip