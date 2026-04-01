import { FaSpinner } from 'react-icons/fa6'

const LoadingSpinner = ({ className = '' }) => {
    return <FaSpinner className={`animate-spin ${className}`} />
}

export default LoadingSpinner