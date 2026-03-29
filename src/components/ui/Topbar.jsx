import { Link } from 'react-router-dom'
import UserProfile from './UserProfile'

const Topbar = ({ displayName, email, onLogout }) => {
    return (
        <header className='sticky top-0 border-b border-neutral3 bg-white/80 backdrop-blur'>
            <div className='mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4'>
                <Link to='/' className='text-lg font-semibold tracking-tight text-neutral0'>
                    Pack-It
                </Link>

                <UserProfile displayName={displayName} email={email} onLogout={onLogout} />
            </div>
        </header>
    )
}

export default Topbar