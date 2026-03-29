const Input = ({ label, id, error, className = '', containerClassName = '', ...props }) => {
    return (
        <div className={containerClassName}>
            {label ? (
                <label htmlFor={id} className='text-sm font-medium text-neutral0'>
                    {label}
                </label>
            ) : null}

            <input
                id={id}
                className={`w-full rounded-xl border border-neutral2 bg-neutral5 px-3 py-2.5 text-sm text-neutral0 outline-none transition placeholder:text-neutral1 focus:border-neutral1 focus:ring-2 focus:ring-neutral3 ${label ? 'mt-1' : ''} ${className}`}
                aria-invalid={Boolean(error)}
                {...props}
            />

            {error ? <p className='text-xs text-negative0'>{error}</p> : null}
        </div>
    )
}

export default Input