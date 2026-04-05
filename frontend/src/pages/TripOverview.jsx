import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Topbar from '../components/ui/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Item from '../components/items/Item'
import ItemGhost from '../components/ghost/ItemGhost'
import AddItemForm from '../components/items/AddItemForm'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../contexts/TripsContext'
import { useTripItems } from '../contexts/ItemsContext'
import Return from '../components/ui/Return'
import { FiEdit, FiPackage, FiTrash2 } from 'react-icons/fi'
import { removeItem, removeTripItems, updateItemChecked, updateItemManualMetrics } from '../services/itemService'
import { deleteTripPlan } from '../services/planService'
import { getTripById, getTripThumbnail } from '../utils/tripUtils'
import LoadingScreen from '../components/ui/LoadingScreen'
import ErrorScreen from '../components/ui/ErrorScreen'
import { BsStars } from 'react-icons/bs'
import { FiSearch } from 'react-icons/fi'
import { FaRegCalendar } from 'react-icons/fa6'
import { formatDisplayDate } from '../utils/formatters'
import { getTotalWeight } from '../utils/itemUtils'
import { useTripPlan } from '../contexts/PlansContext'
import { useSuitcases } from '../contexts/SuitcasesContext'
import Dropdown from '../components/popover/Dropdown'
import { TbDots } from 'react-icons/tb'
import useWeightFormatter from '../hooks/useWeightFormatter'
import EditItemModal from '../components/items/EditItemModal'
import NoSuitcaseModal from '../components/plans/NoSuitcaseModal'

const getCreatedAtMs = (item) => {
    const createdAt = item?.createdAt

    if (!createdAt) {
        return 0
    }

    if (typeof createdAt?.toMillis === 'function') {
        return createdAt.toMillis()
    }

    if (createdAt instanceof Date) {
        return createdAt.getTime()
    }

    const parsed = new Date(createdAt).getTime()
    return Number.isNaN(parsed) ? 0 : parsed
}

const TripOverview = () => {
    const navigate = useNavigate()
    const { tripId } = useParams()
    const { user, profile, logout } = useAuth()
    const { trips, loading: tripsLoading, error: tripsError, removeTrip, deleting, deleteError } = useTrips()
    const { items, loading: itemsLoading, error: itemsError } = useTripItems(tripId)
    const { plan, loading: planLoading } = useTripPlan(tripId)
    const { suitcases, loading: suitcasesLoading } = useSuitcases()

    const [showAddForm, setShowAddForm] = useState(false)
    const [updatingItemIds, setUpdatingItemIds] = useState(new Set())
    const [deletingItemIds, setDeletingItemIds] = useState(new Set())
    const [editingItem, setEditingItem] = useState(null)
    const [savingEdit, setSavingEdit] = useState(false)
    const [editError, setEditError] = useState(null)
    const [actionError, setActionError] = useState(null)
    const [showNoSuitcaseModal, setShowNoSuitcaseModal] = useState(false)
    const { formatWeight } = useWeightFormatter()
    const trip = useMemo(() => getTripById(trips, tripId), [trips, tripId])
    const totalWeight = useMemo(() => getTotalWeight(items), [items])
    const formattedStartDate = formatDisplayDate(trip?.startDate)
    const formattedEndDate = formatDisplayDate(trip?.endDate)
    const formattedTotalWeight = formatWeight(totalWeight, { decimals: 2 })
    const formattedBaggageLimit = formatWeight(trip?.baggageLimit ?? 0, { decimals: 2 })
    const isOverWeightLimit = totalWeight > (trip?.baggageLimit ?? 0)
    const flightClassLabel = trip?.flightClass || '—'
    const hasExistingPlan = Boolean(plan)
    const hasSuitcases = suitcases.length > 0
    const isItemsSectionBusy = itemsLoading || deleting
    const hasFailedWeight = items.some((item) => item?.weight?.success === false)
    const orderedItems = useMemo(() => {
        return [...items].sort((a, b) => getCreatedAtMs(a) - getCreatedAtMs(b))
    }, [items])

    if (!user) {
        return <Navigate to='/login' replace />
    }

    if (tripsLoading) {
        return <LoadingScreen text='Loading trip...' className='bg-neutral4' />
    }

    if (tripsError) {
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
            await deleteTripPlan(user.uid, tripId)
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

    const handleDeleteTrip = async (closeMenu) => {
        try {
            setActionError(null)
            closeMenu?.()

            await removeTripItems(user.uid, tripId)
            await deleteTripPlan(user.uid, tripId)
            await removeTrip(tripId)
            navigate('/home', { replace: true })
        } catch (errorValue) {
            setActionError(errorValue)
        }
    }

    const handleSaveItemMetrics = async (payload) => {
        if (!editingItem?.id) {
            return
        }

        try {
            setSavingEdit(true)
            setEditError(null)
            await updateItemManualMetrics(editingItem.id, payload)
            await deleteTripPlan(user.uid, tripId)
            setEditingItem(null)
        } catch (errorValue) {
            setEditError(errorValue)
        } finally {
            setSavingEdit(false)
        }
    }

    const handleOpenPlanOverview = () => {
        if (!suitcasesLoading && !hasSuitcases) {
            setShowNoSuitcaseModal(true)
            return
        }

        navigate(`/trips/${tripId}/plan`)
    }

    return (
        <main className='min-h-screen bg-neutral5'>
            <Topbar displayName={displayName} email={user.email} onLogout={logout} />

            <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10'>
                <Return text={'Back to home'} />
                <>
                    <Card className='group overflow-hidden p-0!'>
                        <div className='relative h-48 w-full'>
                            <img
                                src={getTripThumbnail(trip)}
                                alt={`${trip.destination} thumbnail`}
                                className='h-full w-full object-cover'
                            />

                            <div className='absolute inset-0 bg-linear-to-t from-black/70 to-transparent' />

                            <div className='absolute inset-x-0 bottom-0 p-6'>
                                <h1 className='text-3xl font-semibold text-white'>{trip.destination}</h1>
                                <p className='mt-1 flex items-center gap-2 text-sm text-white/90'>
                                    <FaRegCalendar className='text-xs' />
                                    {formattedStartDate} → {formattedEndDate}
                                </p>
                            </div>

                            <div className='absolute right-4 top-4'>
                                <Dropdown
                                    trigger={({ open, toggle }) => (
                                        <button
                                            type='button'
                                            onClick={toggle}
                                            // className={`rounded-lg p-2 text-white transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 bg-neutral0/4 backdrop-blur ${open ? 'opacity-100 bg-neutral0/8' : 'opacity-100 hover:bg-neutral0/8'}`}
                                            className={`rounded-lg p-2 text-white transition bg-neutral0/4 backdrop-blur ${open ? 'opacity-100 bg-neutral0/8' : 'opacity-100 hover:bg-neutral0/8'}`}
                                            aria-haspopup='menu'
                                            aria-expanded={open}
                                            aria-label='Trip actions'
                                        >
                                            <TbDots className='text-xl' />
                                        </button>
                                    )}
                                >
                                    {({ close }) => (
                                        <div className='space-y-2'>
                                            <button
                                                type='button'
                                                onClick={() => {
                                                    close()
                                                    navigate(`/trips/${tripId}/edit`)
                                                }}
                                                className='w-full rounded-lg px-3 py-2 text-left text-sm font-medium flex items-center gap-3 text-neutral0 transition hover:bg-neutral4'
                                                role='menuitem'
                                            >
                                                <FiEdit className='text-neutral1' /> Edit
                                            </button>

                                            <hr className='border-neutral3' />

                                            <button
                                                type='button'
                                                onClick={() => handleDeleteTrip(close)}
                                                disabled={deleting}
                                                className='w-full rounded-lg px-3 py-2 text-left text-sm font-medium flex items-center gap-3 text-negative1 transition hover:bg-neutral4 disabled:cursor-not-allowed disabled:opacity-60'
                                                role='menuitem'
                                            >
                                                <FiTrash2 /> {deleting ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    )}
                                </Dropdown>
                            </div>
                        </div>

                        <div className='flex flex-wrap items-start justify-between gap-4 p-6 text-center'>
                            <div className='flex min-w-28 flex-1 flex-col items-center justify-center'>
                                <p className='text-2xl font-semibold text-primary0'>{items.length}</p>
                                <p className='text-sm text-neutral1'>Items</p>
                            </div>

                            <div className='flex min-w-28 flex-1 flex-col items-center justify-center'>
                                <p className={`text-2xl font-semibold ${isOverWeightLimit ? 'text-negative1' : 'text-positive1'}`}>
                                    {formattedTotalWeight}
                                </p>
                                <p className='text-sm text-neutral1'>Total Weight</p>
                            </div>

                            <div className='flex min-w-28 flex-1 flex-col items-center justify-center'>
                                <p className='text-2xl font-semibold text-neutral0'>{formattedBaggageLimit}</p>
                                <p className='text-sm text-neutral1'>Limit</p>
                            </div>

                            <div className='flex min-w-28 flex-1 flex-col items-center justify-center'>
                                <p className='text-2xl font-semibold text-neutral0'>{flightClassLabel}</p>
                                <p className='text-sm text-neutral1'>Class</p>
                            </div>
                        </div>
                    </Card>

                    <section className='flex flex-col gap-3'>
                        <div className='flex items-center justify-between'>
                            <h2 className='text-xl font-semibold text-neutral0'>Items</h2>

                            <Button
                                type='button'
                                variant='secondary'
                                onClick={() => setShowAddForm((prev) => !prev)}
                                disabled={isItemsSectionBusy}
                            >
                                Add Item
                            </Button>
                        </div>

                        {showAddForm ? (
                            <AddItemForm tripId={tripId} setShowAddForm={setShowAddForm} />
                        ) : null}

                        {actionError ? <p className='text-sm text-negative1'>{actionError.message}</p> : null}
                        {deleteError ? <p className='text-sm text-negative1'>{deleteError.message}</p> : null}

                        {itemsLoading ? (
                            <div className='flex flex-col gap-3'>
                                <ItemGhost />
                                <ItemGhost />
                                <ItemGhost />
                            </div>
                        ) : itemsError ? (
                            <ErrorScreen text={itemsError.message ?? 'Failed to load items.'} className='bg-neutral4' />
                        ) : items.length === 0 ? (
                            <div className='flex flex-col gap-3 items-center justify-center py-16'>
                                <div className='p-6 bg-neutral4 rounded-full'>
                                    <FiPackage className='text-4xl text-neutral1' />
                                </div>
                                <div className='flex flex-col items-center'>
                                    <p className='text-neutral0 font-semibold'>No items added yet.</p>
                                    <p className='text-sm text-neutral1'>Start building your packing list!</p>
                                </div>
                            </div>
                        ) : (
                            <div className='flex flex-col gap-3'>
                                {orderedItems.map((item) => (
                                    <Item
                                        key={item.id}
                                        item={item}
                                        onToggleChecked={handleToggleChecked}
                                        onDelete={handleDeleteItem}
                                        onEdit={(itemValue) => setEditingItem(itemValue)}
                                        isUpdating={updatingItemIds.has(item.id)}
                                        isDeleting={deletingItemIds.has(item.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {items.length > 0 ? (
                        <Button
                            className='flex gap-2'
                            loading={planLoading}
                            disabled={hasFailedWeight}
                            onClick={handleOpenPlanOverview}
                        >
                            {hasExistingPlan ? <FiSearch /> : <BsStars />}
                            {hasExistingPlan ? 'View AI Packing Suggestions' : 'Get AI Packing Suggestions'}
                        </Button>
                    ) : null}
                </>


            </div>

            <EditItemModal
                open={Boolean(editingItem)}
                item={editingItem}
                onClose={() => {
                    if (!savingEdit) {
                        setEditingItem(null)
                        setEditError(null)
                    }
                }}
                onSubmit={handleSaveItemMetrics}
                saving={savingEdit}
                error={editError}
            />

            <NoSuitcaseModal
                open={showNoSuitcaseModal}
                onClose={() => setShowNoSuitcaseModal(false)}
                onAddSuitcase={() => navigate('/suitcases')}
            />
        </main>
    )
}

export default TripOverview