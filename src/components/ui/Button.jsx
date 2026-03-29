const VARIANT_STYLES = {
    primary: 'bg-neutral0 text-primary0 hover:opacity-90',
    secondary: 'bg-primary0 text-neutral0 border border-neutral2 hover:bg-neutral4',
    ghost: 'bg-transparent text-neutral0 hover:bg-neutral4',
}

const Button = ({
    children,
    type = 'button',
    variant = 'primary',
    className = '',
    loading = false,
    disabled = false,
    ...props
}) => {
    
    const isDisabled = loading || disabled

    return (
        <button
            type={type}
            disabled={isDisabled}
            className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium transition 
                ${VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary} 
                disabled:cursor-not-allowed disabled:opacity-60 
                cursor-pointer
                ${className}`}
            {...props}
        >
            {loading ? 'Please wait...' : children}
        </button>
    )

}

export default Button