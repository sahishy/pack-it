import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BadgeCheck, ChevronsUpDown, LogOut, Settings } from 'lucide-react'
import { FaHouse, FaSuitcaseRolling, FaWrench } from 'react-icons/fa6'
import { useAuth } from '@/contexts/AuthContext'
import LogoLarge from '@/assets/logo_lg.png'
import LogoSmall from '@/assets/logo_sm.png'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, useSidebar } from '@/components/ui/sidebar'

const navigation = [
    { label: 'Home', href: '/home', icon: FaHouse },
    { label: 'Suitcases', href: '/suitcases', icon: FaSuitcaseRolling },
    { label: 'Tools', href: '/tools', icon: FaWrench },
]

const AppSidebar = ({ displayName, email, onLogout }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const { profile } = useAuth()
    const { isMobile, setOpenMobile } = useSidebar()
    const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase() || '?'
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
                        <DropdownMenu>
                            <DropdownMenuTrigger render={<SidebarMenuButton size='lg' className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground' />}>
                                <Avatar className='size-8 rounded-lg'>
                                    <AvatarImage src={profilePictureUrl || undefined} alt={displayName || 'User'} />
                                    <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
                                </Avatar>
                                <div className='grid flex-1 text-left text-sm leading-tight'><span className='truncate font-medium'>{displayName || 'Traveler'}</span><span className='truncate text-xs text-muted-foreground'>{email}</span></div>
                                <ChevronsUpDown className='ml-auto size-4' />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='min-w-56 rounded-lg' side={isMobile ? 'bottom' : 'right'} align='end' sideOffset={4}>
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel className='p-0 font-normal'>
                                        <div className='flex items-center gap-2 px-2 py-2 text-left text-sm'>
                                            <Avatar className='size-8 rounded-lg'><AvatarImage src={profilePictureUrl || undefined} alt={displayName || 'User'} /><AvatarFallback className='rounded-lg'>{initials}</AvatarFallback></Avatar>
                                            <div className='grid flex-1 leading-tight'><span className='truncate font-medium'>{displayName || 'Traveler'}</span><span className='truncate text-xs text-muted-foreground'>{email}</span></div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => { closeMobile(); navigate('/settings') }}><BadgeCheck /> Account</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { closeMobile(); navigate('/settings') }}><Settings /> Settings</DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onLogout?.()}><LogOut /> Log out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

export default AppSidebar
