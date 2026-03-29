import BasePopover from './BasePopover'
import { TbSelector } from 'react-icons/tb'

const Select = ({
    label,
    id,
    value,
    onChange,
    options = [],
    placeholder = 'Select an option',
    className = '',
    containerClassName = '',
}) => {
    const selectedLabel = value || placeholder

    return (
        <div className={containerClassName}>
            {label ? (
                <label htmlFor={id} className='text-sm font-medium text-neutral0'>
                    {label}
                </label>
            ) : null}

            <BasePopover
                contentClassName='min-w-[var(--popover-trigger-width)] rounded-xl border border-neutral3 bg-neutral5 p-2 shadow-md shadow-shadow'
                trigger={({ open, toggle }) => (
                    <button
                        id={id}
                        type='button'
                        onClick={toggle}
                        className={`mt-1 flex w-full items-center justify-between rounded-xl border border-neutral2 bg-neutral5 px-3 py-2.5 text-sm text-neutral0 outline-none transition focus:border-neutral1 focus:ring-2 focus:ring-neutral3 ${className}`}
                        aria-haspopup='listbox'
                        aria-expanded={open}
                    >
                        <span className={value ? 'text-neutral0' : 'text-neutral1'}>{selectedLabel}</span>
                        <TbSelector className='text-base text-neutral1' aria-hidden='true' />
                    </button>
                )}
            >
                {({ close }) => (
                    <ul role='listbox'>
                        {options.map((optionValue) => (
                            <li key={optionValue}>
                                <button
                                    type='button'
                                    role='option'
                                    aria-selected={value === optionValue}
                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${value === optionValue ? 'bg-neutral4 font-medium text-neutral0' : 'text-neutral0 hover:bg-neutral4'}`}
                                    onClick={() => {
                                        onChange?.(optionValue)
                                        close()
                                    }}
                                >
                                    {optionValue}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </BasePopover>
        </div>
    )
}

export default Select