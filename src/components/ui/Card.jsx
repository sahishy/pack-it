const Card = ({ children, className = '' }) => {
    return (
        <div className={`rounded-2xl border border-neutral3 bg-primary0 p-6 shadow-lg shadow-shadow ${className}`}>
            {children}
        </div>
    )
}

export default Card