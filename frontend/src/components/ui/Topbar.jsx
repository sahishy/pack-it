import { Link, NavLink } from 'react-router-dom'
import UserProfile from '../auth/UserProfile'
import LogoLarge from '../../assets/logo_lg.png'

const NavTab = ({ to, children }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => (
                `rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    isActive
                        ? 'bg-primary0 text-white'
                        : 'bg-transparent text-neutral1 hover:bg-neutral0/4'
                }`
            )}
        >
            {children}
        </NavLink>
    )
}

const Topbar = ({ displayName, email, onLogout }) => {

    return (
        <header className='sticky top-0 border-b z-60 border-neutral3 bg-neutral5/80 backdrop-blur'>
            <div className='relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-2'>
                <Link to='/' className='text-lg font-semibold tracking-tight text-neutral0'>
                    <img src={LogoLarge} alt='Pack-It Logo' className='w-24' />
                </Link>

                <div className='pointer-events-none absolute inset-x-0 justify-center hidden lg:flex'>
                    <nav className='pointer-events-auto flex items-center gap-2'>
                        <NavTab to='/home'>Home</NavTab>
                        <NavTab to='/tools'>Tools</NavTab>
                    </nav>
                </div>

                <UserProfile displayName={displayName} email={email} onLogout={onLogout} />
            </div>
        </header>
    )
}

export default Topbar