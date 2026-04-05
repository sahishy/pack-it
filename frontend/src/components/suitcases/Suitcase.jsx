import { FiTrash2 } from 'react-icons/fi'
import Card from '../ui/Card'
import useWeightFormatter from '../../hooks/useWeightFormatter'
import { FaSuitcaseRolling } from 'react-icons/fa6'

const Suitcase = ({ suitcase, onDelete, deleting = false }) => {
    const { formatDimensions } = useWeightFormatter()

    return (
        <Card className='flex flex-col gap-3'>
            <div className='flex gap-3'>
                <div className='w-12 h-12 rounded-xl bg-neutral4 flex items-center justify-center'>
                    <FaSuitcaseRolling className='text-neutral1 text-2xl'/>
                </div>
                <div className='flex flex-col'>
                    <p className='text-lg font-semibold text-neutral0'>{suitcase.name}</p>
                    <p className='text-sm text-neutral1'>
                        {formatDimensions(suitcase.dimensions, { decimals: 1 })}
                    </p>                    
                </div>

            </div>

            <div className='flex justify-end'>
                <button
                    type='button'
                    className='rounded-lg p-2 text-neutral1 transition hover:bg-neutral4 hover:text-negative1 disabled:cursor-not-allowed disabled:opacity-60'
                    onClick={() => onDelete?.(suitcase.id)}
                    aria-label={`Delete ${suitcase.name}`}
                    disabled={deleting}
                >
                    <FiTrash2 />
                </button>              
            </div>


        </Card>
    )
}

export default Suitcase
