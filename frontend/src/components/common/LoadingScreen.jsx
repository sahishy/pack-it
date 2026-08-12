import { FaRobot } from 'react-icons/fa'
import { Card } from '@/components/ui/card'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Logo from '@/assets/logo_sm.png'

const LoadingScreen = ({ text = 'Loading...', className = '' }) => {
    return (
        <div className={`min-h-screen bg-neutral5 flex items-center justify-center ${className}`}>
            <div className="absolute flex flex-col gap-3 items-center">
                <img src={Logo} className="w-12 h-12"/>
                <img src={Logo} className="w-12 h-12 absolute animate-ping"/>
                {/* <LoadingSpinner className='text-neutral2 text-2xl' /> */}
                {/* <p className='text-sm text-neutral1'>{text}</p> */}
            </div>
        </div>
    )
}

export default LoadingScreen
