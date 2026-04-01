import { FaRobot } from 'react-icons/fa'
import Card from './Card'
import LoadingSpinner from './LoadingSpinner'

const LoadingScreen = ({ text = 'Loading...', className = '' }) => {
    return (
        <div className={`min-h-screen flex items-center justify-center ${className}`}>
            <Card className="flex flex-col gap-3 items-center">
                <LoadingSpinner className='text-primary0 text-2xl' />
                <p className='text-sm text-neutral1'>{text}</p>
            </Card>
        </div>
    )
}

export default LoadingScreen