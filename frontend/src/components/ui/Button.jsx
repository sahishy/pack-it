const VARIANT_STYLES = {
    primary: 'bg-linear-to-t from-primary0 to-primary1 text-white border border-primary0 hover:to-primary0',
    secondary: 'bg-linear-to-t from-neutral4 to-neutral5 text-neutral0 border border-neutral2 hover:to-neutral4'
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
            className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition
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