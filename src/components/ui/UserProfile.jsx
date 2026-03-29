import Dropdown from '../popover/Dropdown'

const getInitials = (nameOrEmail = '') => {

    const trimmed = nameOrEmail.trim()
    if(!trimmed) return '??'

    const parts = trimmed.split(' ').filter(Boolean)
    if(parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }

    return trimmed.slice(0, 2).toUpperCase()

}

const UserProfile = ({ displayName, email, onLogout }) => {

    const initials = getInitials(displayName || email)

    return (

        <Dropdown
            align='right'
            trigger={({ open, toggle }) => (
                <button
                    type='button'
                    onClick={toggle}
                    className={`items-center rounded-full text-left transition border-4 ${open ? 'border-neutral3' : 'border-transparent hover:border-neutral3'}`}
                    aria-haspopup='menu'
                    aria-expanded={open}
                >
                    <div className='flex w-9 h-9 items-center justify-center rounded-full bg-neutral0 text-xs font-semibold text-primary0'>
                        {initials}
                    </div>
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

    )
}

export default UserProfile