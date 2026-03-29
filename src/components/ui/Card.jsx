const Card = ({ children, className = '' }) => {
    return (
        <div className={`rounded-2xl border border-neutral3 bg-neutral5 p-6 shadow-md shadow-shadow ${className}`}>
            {children}
        </div>
    )
}

export default Card