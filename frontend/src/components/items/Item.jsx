import Card from '../ui/Card'
import { FiAlertTriangle, FiEdit, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { getCategoryEmoji, getResolvedItemDimensionsCm, hasLowItemMetricConfidence } from '../../utils/itemUtils'
import Checkbox from '../ui/Checkbox'
import useWeightFormatter from '../../hooks/useWeightFormatter'
import { FaXmark } from 'react-icons/fa6'

const Item = ({ item, onToggleChecked, onDelete, onEdit, isUpdating = false, isDeleting = false }) => {
    const isBusy = isUpdating || isDeleting
    const { formatWeight, formatDimensions } = useWeightFormatter()
    const rawWeight = item?.weight
    const rawDimensions = item?.dimensions
    const hasLegacyWeight = typeof rawWeight === 'number'
    const hasWeightResponse = hasLegacyWeight || (typeof rawWeight === 'object' && rawWeight !== null && typeof rawWeight.success === 'boolean')
    const isWeightPending = !hasWeightResponse
    const isWeightFailed = !hasLegacyWeight && rawWeight?.success === false
    const isDimensionsFailed = rawDimensions && rawDimensions?.success === false
    const hasItemError = isWeightFailed || isDimensionsFailed
    const hasLowConfidenceMetrics = hasLowItemMetricConfidence(item)
    const weightFailureReason = rawWeight?.reason || 'Item not recognized'
    const resolvedWeightKg = hasLegacyWeight
        ? rawWeight
        : rawWeight?.success === true
            ? Number(rawWeight.weightKg) || 0
            : 0
    const resolvedDimensionsCm = getResolvedItemDimensionsCm(rawDimensions)

    return (
        <Card className={`py-3! px-4!`}>
            <div className='flex items-center justify-between'>
                <div className='flex min-w-0 items-center gap-3'>

                    <Checkbox
                        checked={Boolean(item.checked)}
                        onChange={(event) => onToggleChecked(item.id, event.target.checked)}
                        disabled={isBusy}
                        aria-label={`Mark ${item.name} as packed`}
                    />

                    <div className='flex gap-3 items-center'>
                        <span className='text-3xl' aria-hidden='true'>
                            {getCategoryEmoji(item.category)}
                        </span>
                        <div className='min-w-0'>
                            <h3 className={`text-sm font-semibold ${item.checked ? 'text-neutral1 line-through' : 'text-neutral0'}`}>
                                {item.name}
                            </h3>
                            {isWeightPending ? (
                                <div className='mt-1 h-3 w-36 animate-pulse rounded bg-neutral3' />
                            ) : isWeightFailed ? (
                                <p className='text-xs flex items-center gap-1 font-medium text-negative1'><FaXmark/> {weightFailureReason}</p>
                            ) : (
                                <div className='flex flex-wrap items-center gap-2 text-xs text-neutral1'>
                                    <p className='capitalize'>{item.category}</p>
                                    {item.quantity > 1 ? <p className='font-medium'>x{item.quantity}</p> : null}
                                    <p className='text-primary0 font-medium'>{formatWeight(resolvedWeightKg, { decimals: 2 })}</p>
                                    <p>{formatDimensions(resolvedDimensionsCm, { decimals: 1 })}</p>
                                    {hasLowConfidenceMetrics ? (
                                        <span className='inline-flex items-center gap-1 rounded-full bg-warning2/20 px-2 py-0.5 text-warning1'>
                                            <FiAlertTriangle /> Low Confidence
                                        </span>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                <div className='flex items-center gap-1'>
                    {hasLowConfidenceMetrics ? (
                        <button
                            type='button'
                            onClick={() => onEdit?.(item)}
                            disabled={isBusy}
                            className='rounded-lg p-2 text-warning1 cursor-pointer transition hover:bg-neutral4 disabled:cursor-not-allowed disabled:opacity-60'
                            aria-label={`Edit ${item.name} metrics`}
                        >
                            <FiEdit className='text-xl' />
                        </button>
                    ) : null}

                    <button
                        type='button'
                        onClick={() => onDelete(item.id)}
                        disabled={isBusy}
                        className={`rounded-lg p-2 transition cursor-pointer ${hasItemError ? 'animate-pulse bg-negative2 text-negative1 hover:animate-none' : 'text-neutral1 hover:bg-neutral4 hover:text-negative1'} disabled:cursor-not-allowed disabled:opacity-60`}
                        aria-label={`Delete ${item.name}`}
                    >
                        <FiTrash2 className='text-xl' />
                    </button>
                </div>
            </div>
        </Card>
    )
}

export default Item