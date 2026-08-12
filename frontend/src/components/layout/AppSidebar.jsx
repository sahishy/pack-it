import { NavLink, useLocation } from 'react-router-dom'
import { FaHouse, FaSuitcaseRolling, FaWrench } from 'react-icons/fa6'
import { useAuth } from '@/contexts/AuthContext'
import LogoLarge from '@/assets/logo_lg.png'
import LogoSmall from '@/assets/logo_sm.png'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, useSidebar } from '@/components/ui/sidebar'

const navigation = [
    { label: 'Home', href: '/home', icon: FaHouse },
    { label: 'Suitcases', href: '/suitcases', icon: FaSuitcaseRolling },
    { label: 'Tools', href: '/tools', icon: FaWrench },
]

const AppSidebar = ({ displayName, email }) => {
    const location = useLocation()
    const { profile } = useAuth()
    const { isMobile, setOpenMobile } = useSidebar()
    const nameParts = displayName?.trim?.().split(/\s+/).filter(Boolean) ?? []
    const displayNameInitials = nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts.at(-1)[0]}`
        : nameParts[0]?.slice(0, 2)
    const initials = (`${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}` || displayNameInitials || 'TR').toUpperCase()
    const profilePictureUrl = profile?.profilePictureUrl?.trim?.() ?? ''
    const closeMobile = () => { if (isMobile) setOpenMobile(false) }

    return (
        <Sidebar collapsible='icon' variant='inset'>
            <SidebarHeader className='p-4'>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size='lg' className='h-11 mt-4 px-3 hover:bg-transparent active:bg-transparent' render={<NavLink to='/home' onClick={closeMobile} />} tooltip='Pack-It'>
                            <img src={LogoLarge} alt='Pack-It' className='h-auto w-36 shrink-0 object-contain group-data-[collapsible=icon]:hidden' />
                            <img src={LogoSmall} alt='Pack-It' className='hidden size-8 shrink-0 object-contain group-data-[collapsible=icon]:block' />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className='justify-start pb-24 md:justify-center'>
                <SidebarGroup className='px-4 py-3 group-data-[collapsible=icon]:px-2'>
                    <SidebarGroupContent>
                        <SidebarMenu className='gap-4 group-data-[collapsible=icon]:gap-6'>
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton className='h-11 gap-3.5 px-4 text-left text-neutral1 transition-colors duration-150 hover:bg-transparent! hover:text-neutral0! active:bg-transparent! data-active:bg-transparent! data-active:text-neutral0! data-active:hover:bg-transparent!' isActive={isActive} tooltip={item.label} render={<NavLink to={item.href} onClick={closeMobile} />}>
                                            <item.icon className='size-5!' /><span>{item.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className='p-4'>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size='lg'
                            isActive={location.pathname === '/settings'}
                            tooltip='Settings'
                            className='h-12 gap-3 rounded-xl px-2.5 data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground'
                            render={<NavLink to='/settings' onClick={closeMobile} />}
                        >
                            <Avatar className='size-8 rounded-lg'>
                                <AvatarImage className='rounded-lg' src={profilePictureUrl || undefined} alt={displayName || 'User'} />
                                <AvatarFallback className='rounded-lg bg-primary/8 font-medium text-primary'>{initials}</AvatarFallback>
                            </Avatar>
                            <div className='grid flex-1 text-left text-sm leading-tight'>
                                <span className='truncate font-medium'>{displayName || 'Traveler'}</span>
                                <span className='truncate text-xs text-muted-foreground'>{email}</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

export default AppSidebar
