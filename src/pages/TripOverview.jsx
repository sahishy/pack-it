import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import Topbar from '../components/ui/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Item from '../components/items/Item'
import AddItemForm from '../components/items/AddItemForm'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripsContext'
import { useTripItems } from '../contexts/ItemsContext'
import Return from '../components/ui/Return'
import { FiPackage } from 'react-icons/fi'
import { removeItem, updateItemChecked } from '../services/itemService'
import { getTripById, getTripThumbnail } from '../utils/tripUtils'
import LoadingScreen from '../components/ui/LoadingScreen'
import ErrorScreen from '../components/ui/ErrorScreen'

const TripOverview = () => {
    const { tripId } = useParams()
    const { user, profile, logout } = useAuth()
    const { trips, loading: tripsLoading, error: tripsError } = useTrips()
    const { items, loading: itemsLoading, error: itemsError } = useTripItems(tripId)

    const [showAddForm, setShowAddForm] = useState(false)
    const [updatingItemIds, setUpdatingItemIds] = useState(new Set())
    const [deletingItemIds, setDeletingItemIds] = useState(new Set())
    const [actionError, setActionError] = useState(null)
    const trip = useMemo(() => getTripById(trips, tripId), [trips, tripId])

    if(!user) {
        return <Navigate to='/login' replace />
    }

    if(tripsLoading) {
        return <LoadingScreen text='Loading trip...' className='bg-neutral4' />
    }

    if(tripsError) {
        return <ErrorScreen text={tripsError?.message ?? 'Failed to load trip.'} className='bg-neutral4' />
    }

    const displayName = profile?.firstName ? `${profile.firstName} ${profile?.lastName ?? ''}`.trim() : user.email

    if (!trip) {
        return <ErrorScreen text='Trip not found.' className='bg-neutral4' />
    }

    const handleToggleChecked = async (itemId, checked) => {
        try {
            setActionError(null)
            setUpdatingItemIds((prev) => {
                const next = new Set(prev)
                next.add(itemId)
                return next
            })

            await updateItemChecked(itemId, checked)
        } catch (errorValue) {
            setActionError(errorValue)
        } finally {
            setUpdatingItemIds((prev) => {
                const next = new Set(prev)
                next.delete(itemId)
                return next
            })
        }
    }

    const handleDeleteItem = async (itemId) => {
        try {
            setActionError(null)
            setDeletingItemIds((prev) => {
                const next = new Set(prev)
                next.add(itemId)
                return next
            })

            await removeItem(itemId)
        } catch (errorValue) {
            setActionError(errorValue)
        } finally {
            setDeletingItemIds((prev) => {
                const next = new Set(prev)
                next.delete(itemId)
                return next
            })
        }
    }

    return (
        <main className='min-h-screen'>
            <Topbar displayName={displayName} email={user.email} onLogout={logout} />

            <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10'>
                <Return />
                <>
                    <Card className='overflow-hidden p-0!'>
                        <div className='h-64 w-full'>
                            <img
                                src={getTripThumbnail(trip)}
                                alt={`${trip.destination} thumbnail`}
                                className='h-full w-full object-cover'
                            />
                        </div>

                        <div className='p-6'>
                            <h1 className='text-3xl font-semibold text-neutral0'>{trip.destination}</h1>
                        </div>
                    </Card>

                    <section className='flex flex-col gap-3'>
                        <div className='flex items-center justify-between'>
                            <h2 className='text-xl font-semibold text-neutral0'>Items</h2>

                            <Button type='button' variant='secondary' onClick={() => setShowAddForm((prev) => !prev)}>
                                Add Item
                            </Button>
                        </div>

                        {showAddForm ? (
                            <AddItemForm tripId={tripId} setShowAddForm={setShowAddForm} />
                        ) : null}

                        {actionError ? <p className='text-sm text-negative0'>{actionError.message}</p> : null}

                        {itemsLoading ? (
                            <LoadingScreen text='Loading items...' className='bg-neutral4' />
                        ) : itemsError ? (
                            <ErrorScreen text={itemsError.message ?? 'Failed to load items.'} className='bg-neutral4' />
                        ) : items.length === 0 ? (
                            <div className='flex flex-col gap-3 py-16 items-center justify-center'>
                                <FiPackage className='text-neutral2 text-6xl'/>
                                <p className='text-neutral1'>No items added yet. Start building your packing list!</p>
                            </div>
                        ) : (
                            <div className='flex flex-col gap-3'>
                                {items.map((item) => (
                                    <Item
                                        key={item.id}
                                        item={item}
                                        onToggleChecked={handleToggleChecked}
                                        onDelete={handleDeleteItem}
                                        isUpdating={updatingItemIds.has(item.id)}
                                        isDeleting={deletingItemIds.has(item.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </>

                
            </div>
        </main>
    )
}

export default TripOverview