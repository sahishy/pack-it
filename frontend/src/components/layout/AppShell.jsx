import { useEffect, useState } from 'react'
import { matchPath, Outlet, useLocation } from 'react-router-dom'
import { HiMenuAlt4 } from 'react-icons/hi'
import { useAuth } from '@/contexts/AuthContext'
import AppSidebar from '@/components/layout/AppSidebar'
import { SidebarInset, SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import GuestAccountDialog from '@/components/auth/GuestAccountDialog'

const MobileSidebarButton = () => {
    
    const { setOpenMobile } = useSidebar()

    return (
        <Button variant='outline' size='icon-lg' className='pointer-events-auto size-11 rounded-full bg-gray-50/80 shadow-xl backdrop-blur border-none' onClick={() => setOpenMobile(true)} aria-label='Open navigation'>
            <HiMenuAlt4 className='size-6' />
        </Button>
    )

}

const AppShell = () => {
    const { user, profile, isGuest } = useAuth()
    const { pathname } = useLocation()
    const [showGuestAccountDialog, setShowGuestAccountDialog] = useState(false)
    const displayName = profile?.firstName
        ? `${profile.firstName} ${profile?.lastName ?? ''}`.trim()
        : isGuest ? 'Guest traveler' : user?.email
    const hasEdgeToEdgeTop = pathname === '/home' || Boolean(matchPath({ path: '/trips/:tripId', end: true }, pathname))

    useEffect(() => {
        const showUpgrade = () => setShowGuestAccountDialog(true)
        window.addEventListener('packit:guest-upgrade', showUpgrade)
        return () => window.removeEventListener('packit:guest-upgrade', showUpgrade)
    }, [])

    return (
        <SidebarProvider defaultOpen={false} className='h-svh min-h-0 overflow-hidden'>
            <AppSidebar displayName={displayName} email={isGuest ? 'Guest · Save your trips' : user?.email} />
            <SidebarInset className='h-svh min-h-0 min-w-0 overflow-hidden md:h-[calc(100svh-1rem)]'>
                <header className='pointer-events-none absolute inset-x-0 top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center px-3 pt-[env(safe-area-inset-top)] md:hidden'>
                    <MobileSidebarButton />
                </header>
                <div className={`min-h-0 flex-1 overflow-auto ${hasEdgeToEdgeTop ? '' : 'max-md:[&>main]:pt-[calc(5rem+env(safe-area-inset-top))]'}`}>
                    <Outlet />
                </div>
                {isGuest ? <GuestAccountDialog open={showGuestAccountDialog} onOpenChange={setShowGuestAccountDialog} /> : null}
            </SidebarInset>
        </SidebarProvider>
    )
}

export default AppShell
