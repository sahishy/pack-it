import Card from '../ui/Card'
import { FiTrash2 } from 'react-icons/fi'
import { getCategoryEmoji } from '../../utils/itemUtils'
import Checkbox from '../ui/Checkbox'

const Item = ({ item, onToggleChecked, onDelete, isUpdating = false, isDeleting = false }) => {
    const isBusy = isUpdating || isDeleting

    return (
        <Card className='py-3! px-4!'>
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
                            <div className='flex flex-wrap items-center gap-2 text-xs text-neutral1'>
                                <p className='capitalize'>{item.category}</p>
                                {item.quantity > 1 ? <p className='font-medium'>x{item.quantity}</p> : null}
                                <p className='text-primary0 font-medium'>{Number(item.weight ?? 0).toFixed(2)} kg</p>
                            </div>
                        </div>
                    </div>

                </div>

                <button
                    type='button'
                    onClick={() => onDelete(item.id)}
                    disabled={isBusy}
                    className='rounded-lg p-2 text-neutral1 transition cursor-pointer hover:bg-neutral4 hover:text-negative0 disabled:cursor-not-allowed disabled:opacity-60'
                    aria-label={`Delete ${item.name}`}
                >
                    <FiTrash2 className='text-xl' />
                </button>
            </div>
        </Card>
    )
}

export default Item