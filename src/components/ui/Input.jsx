const Input = ({ label, id, error, className = '', ...props }) => {
    return (
        <div>
            {label ? (
                <label htmlFor={id} className='text-sm font-medium text-neutral0'>
                    {label}
                </label>
            ) : null}

            <input
                id={id}
                className={`w-full rounded-xl border border-neutral2 bg-primary0 px-3 py-2.5 text-sm text-neutral0 outline-none transition placeholder:text-neutral1 focus:border-neutral1 focus:ring-2 focus:ring-neutral3 ${className}`}
                aria-invalid={Boolean(error)}
                {...props}
            />

            {error ? <p className='text-xs text-red-600'>{error}</p> : null}
        </div>
    )
}

export default Input