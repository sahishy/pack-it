import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Card from '../components/ui/Card'
import Topbar from '../components/ui/Topbar'

const Home = () => {
    const { user, profile, logout } = useAuth()

    if (!user) {
        return <Navigate to='/login' replace />
    }

    const displayName = profile?.firstName ? `${profile.firstName} ${profile?.lastName ?? ''}`.trim() : user.email

    return (
        <main className='min-h-screen bg-neutral4'>
            <Topbar displayName={displayName} email={user.email} onLogout={logout} />

            <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10'>
                <Card className='flex flex-wrap items-center justify-between gap-4'>
                    <div>
                        <p className='text-sm text-neutral1'>Signed in as</p>
                        <h2 className='text-2xl font-semibold text-neutral0'>{displayName}</h2>
                        <p className='text-sm text-neutral1'>{user.email}</p>
                    </div>
                </Card>

                <Card>
                    <h2 className='text-lg font-semibold text-neutral0'>Welcome to Pack-It</h2>
                </Card>
            </div>
        </main>
    )
}

export default Home
