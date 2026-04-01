const Slider = ({
    id,
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    valueLabel,
    leftHint,
    rightHint,
    containerClassName = '',
}) => {
    return (
        <div className={containerClassName}>
            {label ? (
                <label htmlFor={id} className='text-sm font-medium text-neutral0'>
                    {label}
                </label>
            ) : null}

            {valueLabel ? <p className='mt-1 text-base font-semibold text-primary0'>{valueLabel}</p> : null}

            <input
                id={id}
                type='range'
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange?.(Number(event.target.value))}
                className='mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral2 accent-primary0'
            />

            <div className='mt-2 flex items-center justify-between'>
                <span className='text-xs text-neutral1'>{leftHint}</span>
                <span className='text-xs text-neutral1'>{rightHint}</span>
            </div>
        </div>
    )
}

export default Slider