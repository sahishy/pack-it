import { matchPath, Outlet, useLocation } from 'react-router-dom'
import { HiMenuAlt4 } from 'react-icons/hi'
import { useAuth } from '@/contexts/AuthContext'
import AppSidebar from '@/components/layout/AppSidebar'
import { SidebarInset, SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

const MobileSidebarButton = () => {
    
    const { setOpenMobile } = useSidebar()

    return (
        <Button variant='outline' size='icon-lg' className='pointer-events-auto size-11 rounded-full bg-background/90 shadow-sm backdrop-blur' onClick={() => setOpenMobile(true)} aria-label='Open navigation'>
            <HiMenuAlt4 className='size-6' />
        </Button>
    )

}

const AppShell = () => {
    const { user, profile, logout } = useAuth()
    const { pathname } = useLocation()
    const displayName = profile?.firstName
        ? `${profile.firstName} ${profile?.lastName ?? ''}`.trim()
        : user?.email
    const hasEdgeToEdgeTop = pathname === '/home' || Boolean(matchPath({ path: '/trips/:tripId', end: true }, pathname))

    return (
        <SidebarProvider defaultOpen={false} className='h-svh min-h-0 overflow-hidden'>
            <AppSidebar displayName={displayName} email={user?.email} onLogout={logout} />
            <SidebarInset className='h-svh min-h-0 min-w-0 overflow-hidden md:h-[calc(100svh-1rem)]'>
                <header className='pointer-events-none absolute inset-x-0 top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center px-3 pt-[env(safe-area-inset-top)] md:hidden'>
                    <MobileSidebarButton />
                </header>
                <div className={`min-h-0 flex-1 overflow-auto ${hasEdgeToEdgeTop ? '' : 'max-md:[&>main]:pt-[calc(5rem+env(safe-area-inset-top))]'}`}>
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default AppShell
