import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Dropdown from '../popover/Dropdown'
import { FaArrowLeft, FaDoorOpen, FaGear } from 'react-icons/fa6'

const getInitials = (profile) => {
    const firstInitial = profile?.firstName?.[0]?.toUpperCase() ?? ''
    const lastInitial = profile?.lastName?.[0]?.toUpperCase() ?? ''

    return (firstInitial + lastInitial) || '?'
}

const UserProfile = ({ displayName, email, onLogout }) => {

    const { profile } = useAuth();
    const navigate = useNavigate()
    const initials = getInitials(profile);
    const profilePictureUrl = profile?.profilePictureUrl?.trim?.() ?? ''

    return (
        <div className='flex gap-2 items-center'>
            <span className='hidden text-sm font-medium text-neutral0 lg:flex'>{profile?.firstName || 'Error'} {profile?.lastName || ''}</span>
            <Dropdown
                trigger={({ open, toggle }) => (
                    <button
                        type='button'
                        onClick={toggle}
                        className={`items-center rounded-full text-left transition border-4 ${open ? 'border-neutral3' : 'border-transparent hover:border-neutral3'}`}
                        aria-haspopup='menu'
                        aria-expanded={open}
                    >
                        {profilePictureUrl ? (
                            <img
                                src={profilePictureUrl}
                                alt='Profile'
                                className='h-9 w-9 rounded-full object-cover'
                                referrerPolicy='no-referrer'
                            />
                        ) : (
                            <div className='flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-t from-neutral0 to-neutral1 text-xs font-semibold text-neutral5'>
                                {initials}
                            </div>
                        )}
                    </button>
                )}
            >
                {({ close }) => (
                    <div className='flex flex-col gap-2'>
                        <div className='p-2'>
                            <p className='text-sm font-medium text-neutral0'>{displayName || 'User'}</p>
                            <p className='text-xs text-neutral1'>{email}</p>
                        </div>

                        <hr className='border-neutral3'/>

                        <button
                            type='button'
                            onClick={() => {
                                close()
                                navigate('/settings')
                            }}
                            className='w-full rounded-lg px-3 py-2 text-left text-sm font-medium flex items-center gap-3 text-neutral0 transition hover:bg-neutral4'
                            role='menuitem'
                        >
                            <FaGear className='text-neutral1'/> Settings
                        </button>

                        <hr className='border-neutral3'/>

                        <button
                            type='button'
                            onClick={async () => {
                                close()
                                await onLogout?.()
                            }}
                            className='w-full rounded-lg px-3 py-2 text-left text-sm font-medium flex items-center gap-3 text-neutral0 transition hover:bg-neutral4'
                            role='menuitem'
                        >
                            <FaArrowLeft className='text-neutral1'/> Log Out
                        </button>
                    </div>
                )}
            </Dropdown>
        </div>
    )
}

export default UserProfile