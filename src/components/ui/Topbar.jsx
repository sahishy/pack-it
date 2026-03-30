import { Link } from 'react-router-dom'
import UserProfile from '../auth/UserProfile'
import Logo from '../../assets/logo.png'

const Topbar = ({ displayName, email, onLogout }) => {
    return (
        <header className='sticky top-0 border-b z-60 border-neutral3 bg-white/80 backdrop-blur'>
            <div className='mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-2'>
                <Link to='/' className='text-lg font-semibold tracking-tight text-neutral0'>
                    <img src={Logo} alt='Pack-It Logo' className='w-24' />
                </Link>

                <UserProfile displayName={displayName} email={email} onLogout={onLogout} />
            </div>
        </header>
    )
}

export default Topbar