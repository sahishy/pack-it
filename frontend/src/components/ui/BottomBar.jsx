import { NavLink, useNavigate } from 'react-router-dom'
import { FaHouse, FaPlus, FaSuitcaseRolling, FaWrench } from 'react-icons/fa6'
import Button from './Button'
import UserProfile from '../auth/UserProfile'

const Tab = ({ to, label, icon: Icon, end = false }) => {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) => (
                `flex min-w-20 flex-col items-center gap-1 px-3 py-1 text-sm font-medium transition ${isActive
                    ? 'text-primary0'
                    : 'text-neutral1'
                }`
            )}
        >
            <Icon className='text-sm' />
            <span>{label}</span>
        </NavLink>
    )
}

const BottomBar = ({ displayName, email, onLogout }) => {

    const navigate = useNavigate()

    return (
        <nav
            className='fixed w-full bottom-0 z-60 border-t border-neutral3 bg-neutral5/80 backdrop-blur pt-4 pb-[max(env(safe-area-inset-bottom),2rem)] lg:hidden'
        >
            <div className='mx-auto flex items-center justify-between w-full max-w-4xl'>
                <div className='flex-1 flex justify-center'>
                    <Tab to='/home' label='Home' icon={FaHouse} end />
                </div>

                <div className='flex-1 flex justify-center'>
                    <Tab to='/suitcases' label='Suitcases' icon={FaSuitcaseRolling} end />
                </div>

                <div className='flex-1 flex justify-center'>
                    <Button
                        type='button'
                        aria-label='Create trip'
                        onClick={() => navigate('/trips/new')}
                        className={`absolute bottom-12 h-16 w-16 rounded-full! active:scale-90`}
                    >
                        <FaPlus className='text-2xl' />
                    </Button>
                </div>

                <div className='flex-1 flex justify-center'>
                    <Tab to='/tools' label='Tools' icon={FaWrench} />
                </div>

                <div className='flex-1 flex mb-2 justify-center'>
                    <UserProfile displayName={displayName} email={email} onLogout={onLogout} />
                </div>

            </div>
        </nav>
    )

}

export default BottomBar