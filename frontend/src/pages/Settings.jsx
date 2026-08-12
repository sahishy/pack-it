import { useEffect, useMemo, useState } from 'react'
import { Check, LogOut, Palette, Ruler, Trash2, UserRoundPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '@/contexts/AuthContext'
import { updateUserPreferences } from '@/services/userService'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Select from '@/components/common/FormSelect'
import GuestAccountDialog from '@/components/auth/GuestAccountDialog'
import FormInput from '@/components/common/FormInput'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const DELETE_ACCOUNT_DELAY_MS = 3000

const THEME_OPTIONS = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
]

const MEASUREMENT_OPTIONS = [
    { value: 'metric', label: 'Metric', alias: 'kg, km, ºC' },
    { value: 'imperial', label: 'Imperial', alias: 'lb, mi, ºF' },
]

const resolveTheme = (preference) => {
    if (preference === 'light' || preference === 'dark') {
        return preference
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const Settings = () => {
    const navigate = useNavigate()
    const { user, profile, logout, isGuest, deleteGuestAccount, deleteAccount } = useAuth()
    const [theme, setTheme] = useState(() => profile?.preferences?.theme ?? 'light')
    const [measurementSystem, setMeasurementSystem] = useState(() => profile?.preferences?.measurementSystem ?? 'metric')
    const [saveStatus, setSaveStatus] = useState('idle')
    const [error, setError] = useState('')
    const [loggingOut, setLoggingOut] = useState(false)
    const [showGuestAccountDialog, setShowGuestAccountDialog] = useState(false)
    const [showDeleteGuestDialog, setShowDeleteGuestDialog] = useState(false)
    const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)
    const [deleteAccountEmail, setDeleteAccountEmail] = useState('')
    const [deleteAccountProgress, setDeleteAccountProgress] = useState(0)
    const [deletingAccount, setDeletingAccount] = useState(false)
    const [deleteAccountError, setDeleteAccountError] = useState('')

    const firstName = profile?.firstName?.trim?.() ?? ''
    const lastName = profile?.lastName?.trim?.() ?? ''
    const displayName = `${firstName} ${lastName}`.trim() || user?.displayName || 'Traveler'
    const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || displayName.slice(0, 2).toUpperCase()
    const profilePictureUrl = profile?.profilePictureUrl?.trim?.() || user?.photoURL || ''
    const accountEmail = user?.email?.trim?.() ?? ''
    const emailMatches = Boolean(accountEmail) && deleteAccountEmail.trim().toLowerCase() === accountEmail.toLowerCase()
    const deleteAccountReady = emailMatches && deleteAccountProgress >= 100 && !deletingAccount

    const preferences = useMemo(() => ({
        theme,
        measurementSystem,
    }), [measurementSystem, theme])

    useEffect(() => {
        if (!showDeleteAccountDialog || !emailMatches) return undefined

        const startedAt = performance.now()
        let animationFrame
        const updateCooldown = (now) => {
            const progress = Math.min(((now - startedAt) / DELETE_ACCOUNT_DELAY_MS) * 100, 100)
            setDeleteAccountProgress(progress)
            if (progress < 100) animationFrame = window.requestAnimationFrame(updateCooldown)
        }

        animationFrame = window.requestAnimationFrame(updateCooldown)
        return () => window.cancelAnimationFrame(animationFrame)
    }, [emailMatches, showDeleteAccountDialog])

    const savePreferences = async (nextPreferences) => {
        if (!user?.uid) {
            return
        }

        try {
            setError('')
            setSaveStatus('saving')
            await updateUserPreferences(user.uid, nextPreferences)
            setSaveStatus('saved')
        } catch (saveError) {
            setSaveStatus('error')
            setError(saveError?.message ?? 'Unable to save preferences right now.')
        }
    }

    const handleThemeChange = async (nextTheme) => {
        setTheme(nextTheme)
        document.documentElement.dataset.theme = resolveTheme(nextTheme)
        await savePreferences({ ...preferences, theme: nextTheme })
    }

    const handleMeasurementSystemChange = async (nextMeasurementSystem) => {
        setMeasurementSystem(nextMeasurementSystem)
        await savePreferences({ ...preferences, measurementSystem: nextMeasurementSystem })
    }

    const handleLogout = async () => {
        try {
            setError('')
            setLoggingOut(true)
            await logout()
        } catch (logoutError) {
            setError(logoutError?.message ?? 'Unable to log out right now.')
            setLoggingOut(false)
        }
    }

    const handleDeleteGuest = async () => {
        try {
            setError('')
            setLoggingOut(true)
            await deleteGuestAccount()
            navigate(Capacitor.isNativePlatform() ? '/capacitor' : '/landing', { replace: true })
        } catch (deleteError) {
            setError(deleteError?.message ?? 'Unable to delete guest data right now.')
            setLoggingOut(false)
        }
    }

    const openDeleteAccountDialog = () => {
        setDeleteAccountEmail('')
        setDeleteAccountError('')
        setDeleteAccountProgress(0)
        setShowDeleteAccountDialog(true)
    }

    const handleDeleteAccount = async () => {
        if (!deleteAccountReady) return

        try {
            setDeleteAccountError('')
            setDeletingAccount(true)
            await deleteAccount(deleteAccountEmail.trim())
            navigate(Capacitor.isNativePlatform() ? '/capacitor' : '/landing', { replace: true })
        } catch (deleteError) {
            setDeleteAccountError(deleteError?.message ?? 'Unable to delete your account right now.')
            setDeletingAccount(false)
        }
    }

    return (
        <main className='mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:py-12'>
            <header>
                <h1 className='text-xl font-medium tracking-tight'>Settings</h1>
                <p className='mt-1 text-sm text-muted-foreground'>Manage your account and travel preferences.</p>
            </header>

            <div className='space-y-8 pt-6'>
                <section aria-labelledby='account-heading'>
                    <div className='mb-3'>
                        <h2 id='account-heading' className='text-sm font-medium'>Account</h2>
                        <p className='mt-0.5 text-xs text-muted-foreground'>Your personal Pack-It profile.</p>
                    </div>

                    <Card className='gap-0 p-0!'>
                        <div className='flex items-center gap-4 px-5 py-5'>
                            <Avatar className='size-12 rounded-xl'>
                                <AvatarImage className='rounded-xl' src={profilePictureUrl || undefined} alt={displayName} />
                                <AvatarFallback className='rounded-xl bg-primary/8 font-semibold text-primary'>{initials}</AvatarFallback>
                            </Avatar>
                            <div className='min-w-0'>
                                <p className='truncate text-base font-medium'>{displayName}</p>
                                <p className='truncate text-sm text-muted-foreground'>{isGuest ? 'Guest account · saved on this device' : user?.email}</p>
                            </div>
                        </div>
                    </Card>
                </section>

                <section aria-labelledby='preferences-heading'>
                    <div className='mb-3 flex items-end justify-between gap-4'>
                        <div>
                            <h2 id='preferences-heading' className='text-sm font-medium'>Preferences</h2>
                            <p className='mt-0.5 text-xs text-muted-foreground'>Changes save automatically.</p>
                        </div>
                        {saveStatus === 'saving' ? <p className='text-xs text-muted-foreground'>Saving…</p> : null}
                        {saveStatus === 'saved' ? <p className='flex items-center gap-1 text-xs text-success'><Check className='size-3.5' /> Saved</p> : null}
                    </div>

                    <Card className='gap-0 p-0!'>
                        <div className='flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex items-center gap-3'>
                                <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
                                    <Palette className='size-4' />
                                </div>
                                <div>
                                    <h3 className='font-medium'>Appearance</h3>
                                    <p className='text-xs text-muted-foreground'>Choose how Pack-It looks on this device.</p>
                                </div>
                            </div>
                            <Select
                                id='theme'
                                value={theme}
                                onChange={handleThemeChange}
                                options={THEME_OPTIONS}
                                placeholder='Select theme'
                                containerClassName='w-full sm:w-48'
                            />
                        </div>

                        <div className='flex flex-col gap-4 border-t px-5 py-5 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex items-center gap-3'>
                                <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
                                    <Ruler className='size-4' />
                                </div>
                                <div>
                                    <h3 className='font-medium'>Measurement system</h3>
                                    <p className='text-xs text-muted-foreground'>Set the units used throughout your plans.</p>
                                </div>
                            </div>
                            <Select
                                id='measurement-system'
                                value={measurementSystem}
                                onChange={handleMeasurementSystemChange}
                                options={MEASUREMENT_OPTIONS}
                                placeholder='Select measurement system'
                                containerClassName='w-full sm:w-48'
                            />
                        </div>
                    </Card>
                </section>

                <section aria-labelledby='session-heading'>
                    <div className='mb-3'>
                        <h2 id='session-heading' className='text-sm font-medium'>Session</h2>
                        <p className='mt-0.5 text-xs text-muted-foreground'>Manage access to your account on this device.</p>
                    </div>

                    <Card className='gap-0 p-0!'>
                        <div className='flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex items-center gap-3'>
                                <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive'>
                                    {isGuest ? <UserRoundPlus className='size-4' /> : <LogOut className='size-4' />}
                                </div>
                                <div>
                                    <h3 className='font-medium'>{isGuest ? 'Save your trips' : 'Log out'}</h3>
                                    <p className='text-xs text-muted-foreground'>{isGuest ? 'Create or connect an account to access this data on other devices. Clearing this app or browser makes an unsaved guest account unrecoverable.' : 'You’ll need to sign in again to access your trips.'}</p>
                                </div>
                            </div>
                            {isGuest ? (
                                <Button onClick={() => setShowGuestAccountDialog(true)} className='w-full sm:w-auto'>Create account</Button>
                            ) : (
                                <Button variant='negative' onClick={handleLogout} loading={loggingOut} className='w-full sm:w-auto'>Log out</Button>
                            )}
                        </div>
                        {isGuest ? (
                            <div className='flex flex-col gap-4 border-t px-5 py-5 sm:flex-row sm:items-center sm:justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive'><Trash2 className='size-4' /></div>
                                    <div><h3 className='font-medium'>Delete guest data</h3><p className='text-xs text-muted-foreground'>Permanently remove this guest session and everything in it.</p></div>
                                </div>
                                <Button variant='negative' onClick={() => setShowDeleteGuestDialog(true)} className='w-full sm:w-auto'>Delete data</Button>
                            </div>
                        ) : (
                            <div className='flex flex-col gap-4 border-t px-5 py-5 sm:flex-row sm:items-center sm:justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive'><Trash2 className='size-4' /></div>
                                    <div><h3 className='font-medium'>Delete account</h3><p className='text-xs text-muted-foreground'>Permanently remove your account and all Pack-It data.</p></div>
                                </div>
                                <Button variant='negative' onClick={openDeleteAccountDialog} className='w-full sm:w-auto'>Delete account</Button>
                            </div>
                        )}
                    </Card>
                </section>

                {error ? <p className='text-sm text-destructive'>{error}</p> : null}
            </div>
            <GuestAccountDialog open={showGuestAccountDialog} onOpenChange={setShowGuestAccountDialog} />
            <Dialog open={showDeleteGuestDialog} onOpenChange={(open) => { if (!loggingOut) setShowDeleteGuestDialog(open) }}>
                <DialogContent className='gap-6 rounded-2xl! p-6 sm:max-w-lg'>
                    <DialogHeader className='gap-2 pr-8'>
                        <DialogTitle className='text-xl'>Delete all guest data?</DialogTitle>
                        <DialogDescription className='max-w-md leading-6'>This permanently deletes your trips, items, suitcases, plans, and chat history. It cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <div className='grid grid-cols-2 gap-3'>
                        <Button variant='secondary' onClick={() => setShowDeleteGuestDialog(false)} disabled={loggingOut}>Cancel</Button>
                        <Button variant='negative' onClick={handleDeleteGuest} loading={loggingOut}>Delete data</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={showDeleteAccountDialog} onOpenChange={(open) => { if (!deletingAccount) setShowDeleteAccountDialog(open) }}>
                <DialogContent className='gap-6 rounded-2xl! p-6 sm:max-w-lg'>
                    <DialogHeader className='gap-2 pr-8'>
                        <DialogTitle className='text-xl'>Delete your account?</DialogTitle>
                        <DialogDescription className='max-w-md leading-6'>This permanently deletes your trips, suitcases, packing lists, plans, chat history, and account. This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <FormInput
                        id='delete-account-email'
                        label={`Type ${accountEmail} to confirm`}
                        type='email'
                        autoComplete='email'
                        value={deleteAccountEmail}
                        onChange={(event) => {
                            const nextEmail = event.target.value
                            setDeleteAccountEmail(nextEmail)
                            if (nextEmail.trim().toLowerCase() !== accountEmail.toLowerCase()) setDeleteAccountProgress(0)
                        }}
                        disabled={deletingAccount}
                        error={deleteAccountEmail && !emailMatches ? 'Email does not match this account.' : ''}
                    />
                    {deleteAccountError ? <p className='text-sm text-destructive'>{deleteAccountError}</p> : null}
                    <div className='grid grid-cols-2 gap-3'>
                        <Button className='w-full' variant='outline' onClick={() => setShowDeleteAccountDialog(false)} disabled={deletingAccount}>Cancel</Button>
                        <Button
                            variant='negative'
                            className={`w-full overflow-hidden bg-[#b83e5d]! bg-none! before:hidden! ${deleteAccountProgress < 100 ? 'opacity-60 disabled:opacity-60' : 'opacity-100 disabled:opacity-60'}`}
                            onClick={handleDeleteAccount}
                            disabled={!deleteAccountReady}
                        >
                            <span
                                aria-hidden='true'
                                className='absolute inset-0 z-0 origin-left bg-[linear-gradient(180deg,color-mix(in_oklch,var(--destructive),#ffa0b8_62%)_0%,color-mix(in_oklch,var(--destructive),#f45f82_70%)_52%,color-mix(in_oklch,var(--destructive),#dd4668_68%)_100%)]'
                                style={{ transform: `scaleX(${deleteAccountProgress / 100})` }}
                            />
                            <Trash2 className='relative z-10' />
                            <span className='relative z-10' aria-live='polite'>{deletingAccount ? 'Deleting…' : deleteAccountProgress < 100 ? `Delete account (${Math.max(1, Math.ceil((DELETE_ACCOUNT_DELAY_MS * (1 - deleteAccountProgress / 100)) / 1000))}s)` : 'Delete account'}</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    )
}

export default Settings
