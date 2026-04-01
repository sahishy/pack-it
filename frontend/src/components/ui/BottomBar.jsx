import { NavLink, useNavigate } from 'react-router-dom'
import { FaHouse, FaPlus, FaWrench } from 'react-icons/fa6'
import Button from './Button'

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
            <Icon className='text-lg' />
            <span>{label}</span>
        </NavLink>
    )
}

const BottomBar = () => {

    const navigate = useNavigate()

    return (
        <nav
            className='fixed w-full bottom-0 z-60 border-t border-neutral3 bg-neutral5/80 backdrop-blur pt-4 pb-[max(env(safe-area-inset-bottom),2rem)] lg:hidden'
        >
            <div className='mx-auto grid w-full max-w-4xl grid-cols-3 items-center'>
                <div className='flex justify-center'>
                    <Tab to='/home' label='Home' icon={FaHouse} end />
                </div>

                <div className='flex justify-center'>
                    <Button
                        type='button'
                        aria-label='Create trip'
                        onClick={() => navigate('/trips/new')}
                        className={`absolute bottom-8 h-20 w-20 rounded-full! active:scale-90`}
                    >
                        <FaPlus className='text-2xl' />
                    </Button>
                </div>

                <div className='flex justify-center'>
                    <Tab to='/tools' label='Tools' icon={FaWrench} />
                </div>
            </div>
        </nav>
    )

}

export default BottomBar