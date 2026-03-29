import { FaCheck } from 'react-icons/fa6'

const Checkbox = ({ checked = false, onChange, disabled = false, className = '', ...props }) => {
    return (
        <label className={`inline-flex items-center cursor-pointer ${className}`}>
            <input
                type='checkbox'
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className='peer sr-only'
                {...props}
            />

            <span
                aria-hidden='true'
                className='flex h-4 w-4 items-center justify-center rounded-sm border border-neutral3 bg-neutral5 text-neutral5 transition peer-checked:border-primary0 peer-checked:bg-primary0 peer-disabled:opacity-60'
            >
                <FaCheck className='h-3 w-3' />
            </span>
        </label>
    )
}

export default Checkbox