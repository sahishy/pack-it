import { useAuth } from '../../contexts/AuthContext'
import { getInitials } from '../../utils/userUtils';
import Dropdown from '../popover/Dropdown'

const UserProfile = ({ displayName, email, onLogout }) => {

    const { profile } = useAuth();
    const initials = getInitials(profile);
    const profilePictureUrl = profile?.profilePictureUrl?.trim?.() ?? ''

    return (
        <div className='flex gap-2 items-center'>
            <span className='text-sm font-medium text-neutral0'>Welcome, {profile?.firstName || 'User'}</span>
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
                    <div className='space-y-2'>
                        <div className='border-b border-neutral3 px-2 pb-2'>
                            <p className='text-sm font-medium text-neutral0'>{displayName || 'User'}</p>
                            <p className='text-xs text-neutral1'>{email}</p>
                        </div>

                        <button
                            type='button'
                            onClick={async () => {
                                close()
                                await onLogout?.()
                            }}
                            className='w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral0 transition hover:bg-neutral4'
                            role='menuitem'
                        >
                            Log Out
                        </button>
                    </div>
                )}
            </Dropdown>
        </div>
    )
}

export default UserProfile