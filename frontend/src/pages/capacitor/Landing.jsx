import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { ArrowLeft, ArrowRight, Check, LockKeyhole, UserRoundPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FormInput from '@/components/common/FormInput'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import logo_sm_white from '../../assets/logo_sm_white.png'
import PlaneFlyingVideo from '../../assets/videos/plane_flying.mp4'
import { useAuth } from '@/contexts/AuthContext'
import { auth } from '@/lib/firebase'
import { createNewUserObject, createUserProfile } from '@/services/userService'

const ensureMutedPlayback = (event) => {
    const video = event.currentTarget
    video.muted = true
    video.defaultMuted = true
    video.volume = 0
}

const Landing = () => {
    const navigate = useNavigate()
    const { continueAsGuest } = useAuth()
    const [getStartedOpen, setGetStartedOpen] = useState(false)
    const [loginOpen, setLoginOpen] = useState(false)
    const [loginFormReady, setLoginFormReady] = useState(false)
    const [signupStep, setSignupStep] = useState('choice')
    const [loginStep, setLoginStep] = useState('email')
    const [signupData, setSignupData] = useState({ email: '', firstName: '', lastName: '', password: '', confirmPassword: '' })
    const [loginData, setLoginData] = useState({ email: '', password: '' })
    const [authLoading, setAuthLoading] = useState(false)
    const [authError, setAuthError] = useState('')
    const [guestLoading, setGuestLoading] = useState(false)
    const [guestError, setGuestError] = useState('')
    useEffect(() => {
        if (!loginOpen) {
            setLoginFormReady(false)
            return undefined
        }

        // Delay mounting the autofocus field until after the bottom sheet has
        // opened. This matches the create-account path and lets iOS lay out
        // around the keyboard correctly on the first focus.
        const timeout = window.setTimeout(() => setLoginFormReady(true), 260)
        return () => window.clearTimeout(timeout)
    }, [loginOpen])

    const resetSignup = () => {
        setSignupStep('choice')
        setSignupData({ email: '', firstName: '', lastName: '', password: '', confirmPassword: '' })
        setAuthError('')
    }

    const resetLogin = () => {
        setLoginStep('email')
        setLoginData({ email: '', password: '' })
        setAuthError('')
    }

    const closeGetStarted = () => {
        if (authLoading || guestLoading) return
        setGetStartedOpen(false)
        resetSignup()
    }

    const closeLogin = () => {
        if (authLoading) return
        setLoginOpen(false)
        resetLogin()
    }

    const handleGuestContinue = async () => {
        try {
            setGuestError('')
            setGuestLoading(true)
            await continueAsGuest()
            navigate('/home')
        } catch (error) {
            setGuestError(error?.message ?? 'Unable to start a guest session right now.')
        } finally {
            setGuestLoading(false)
        }
    }

    const continueSignup = (event) => {
        event.preventDefault()
        setAuthError('')

        if (signupStep === 'email') {
            if (!signupData.email.trim()) return setAuthError('Enter your email address to continue.')
            setSignupStep('name')
            return
        }

        if (signupStep === 'name') {
            if (!signupData.firstName.trim() || !signupData.lastName.trim()) return setAuthError('Enter your first and last name.')
            setSignupStep('password')
        }
    }

    const createAccount = async (event) => {
        event.preventDefault()
        setAuthError('')
        if (signupData.password.length < 6) return setAuthError('Password must be at least 6 characters.')
        if (signupData.password !== signupData.confirmPassword) return setAuthError('Passwords do not match.')

        try {
            setAuthLoading(true)
            const credential = await createUserWithEmailAndPassword(auth, signupData.email.trim(), signupData.password)
            await createUserProfile(credential.user.uid, createNewUserObject({
                uid: credential.user.uid,
                firstName: signupData.firstName.trim(),
                lastName: signupData.lastName.trim(),
                email: signupData.email.trim(),
                profilePictureUrl: '',
            }))
            navigate('/home')
        } catch (error) {
            setAuthError(error?.code === 'auth/email-already-in-use' ? 'An account already exists for this email.' : error?.message ?? 'Unable to create your account right now.')
        } finally {
            setAuthLoading(false)
        }
    }

    const continueLogin = async (event) => {
        event.preventDefault()
        setAuthError('')

        if (loginStep === 'email') {
            if (!loginData.email.trim()) return setAuthError('Enter your email address to continue.')
            setLoginStep('password')
            return
        }

        if (!loginData.password) return setAuthError('Enter your password to continue.')
        try {
            setAuthLoading(true)
            await signInWithEmailAndPassword(auth, loginData.email.trim(), loginData.password)
            navigate('/home')
        } catch (error) {
            setAuthError(error?.code === 'auth/invalid-credential' ? 'That email or password does not look right.' : error?.message ?? 'Unable to log in right now.')
        } finally {
            setAuthLoading(false)
        }
    }

    const signupStepNumber = signupStep === 'email' ? 1 : signupStep === 'name' ? 2 : 3

    return (
        <main className='relative isolate flex h-svh min-h-[42rem] overflow-hidden bg-[#07111a] pt-[calc(env(safe-area-inset-top)_+_1.5rem)] pr-[calc(env(safe-area-inset-right)_+_1.5rem)] pb-[calc(env(safe-area-inset-bottom)_+_4rem)] pl-[calc(env(safe-area-inset-left)_+_1.5rem)] text-white'>
            <video autoPlay muted loop playsInline disablePictureInPicture onLoadedMetadata={ensureMutedPlayback} onCanPlay={ensureMutedPlayback} className='absolute inset-0 size-full scale-x-[-1] object-cover' aria-hidden='true'>
                <source src={PlaneFlyingVideo} type='video/mp4' />
            </video>
            <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(3,13,22,0.42)_0%,rgba(3,13,22,0.26)_42%,rgba(2,8,13,0.92)_100%)]' />
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_70%_16%,rgba(44,103,143,0.2),transparent_42%)]' />

            <div className='relative z-10 mx-auto flex w-full max-w-sm flex-col'>
                <section className='flex flex-1 flex-col items-center justify-center pb-80 text-center'>
                    <img src={logo_sm_white} alt='' className='mb-4 size-15 brightness-0 invert' />
                    <h1 className='max-w-xs text-[2rem] font-semibold leading-[1.08] tracking-tight'>Plan your trip packing with confidence.</h1>
                </section>

                <div className='space-y-3'>
                    <Button type='button' onClick={() => setGetStartedOpen(true)} className='h-14 w-full rounded-full! bg-white! bg-none! text-base text-[#07111a]! shadow-[0_12px_30px_rgba(0,0,0,.2)] before:hidden! hover:bg-white/92!'>Get started</Button>
                    <Button type='button' variant='secondary' onClick={() => setLoginOpen(true)} className='h-14 w-full rounded-full! border border-white/16 bg-white/12! bg-none! text-base text-white! shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)] before:hidden! hover:bg-white/18!'>Log in</Button>
                </div>
            </div>

            <Sheet open={getStartedOpen} onOpenChange={(open) => { if (!open) closeGetStarted() }}>
                <SheetContent side='bottom' className='data-[side=bottom]:h-[60svh] gap-0 overflow-y-auto rounded-t-[2rem] border-white/50 bg-background px-6 pb-[calc(env(safe-area-inset-bottom)_+_3rem)] pt-3 shadow-[0_-20px_70px_rgba(0,0,0,.22)]' showCloseButton={signupStep === 'choice'}>
                    <div className='mx-auto mb-8 h-1.5 w-11 rounded-full bg-foreground/10' />
                    <div className='mx-auto flex min-h-0 flex-1 flex-col w-full max-w-md'>
                        {signupStep === 'choice' ? (
                            <>
                                <SheetHeader className='px-0 pb-6 pt-2'>
                                    <SheetTitle className='text-2xl font-semibold tracking-tight'>How would you like to start?</SheetTitle>
                                    <SheetDescription className='mt-2 leading-6'>Create an account to save your plans everywhere, or explore Pack-It as a guest.</SheetDescription>
                                </SheetHeader>
                                <div className='mt-auto grid gap-3 pb-4'>
                                    <Button type='button' className='h-14 w-full rounded-2xl!' onClick={() => { setAuthError(''); setSignupStep('email') }}><UserRoundPlus /> Create account</Button>
                                    <Button type='button' variant='secondary' className='h-14 w-full rounded-2xl!' loading={guestLoading} onClick={handleGuestContinue}>Continue as guest</Button>
                                    {guestError ? <p className='rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive'>{guestError}</p> : null}
                                </div>
                            </>
                        ) : (
                            <>
                                <button type='button' onClick={() => { setAuthError(''); setSignupStep(signupStep === 'email' ? 'choice' : signupStep === 'name' ? 'email' : 'name') }} className='mb-5 inline-flex size-10 items-center justify-center rounded-full bg-muted text-foreground transition active:scale-95' aria-label='Previous step'><ArrowLeft className='size-4' /></button>
                                <SheetHeader className='px-0 pb-6 pt-0'>
                                    <p className='text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground'>Step {signupStepNumber} of 3</p>
                                    <SheetTitle className='mt-2 text-2xl font-semibold tracking-tight'>{signupStep === 'email' ? 'What’s your email?' : signupStep === 'name' ? 'What should we call you?' : 'Secure your account'}</SheetTitle>
                                    <SheetDescription className='mt-2 leading-6'>{signupStep === 'email' ? 'We’ll use this to keep your trips connected to you.' : signupStep === 'name' ? `This will personalize your Pack-It experience.` : `Create a password for ${signupData.email}.`}</SheetDescription>
                                </SheetHeader>
                                <form onSubmit={signupStep === 'password' ? createAccount : continueSignup} className='flex flex-1 flex-col' aria-busy={authLoading}>
                                    <div className='space-y-4'>
                                        {signupStep === 'email' ? <FormInput autoFocus label='Email address' type='email' autoComplete='email' inputMode='email' placeholder='you@example.com' value={signupData.email} onChange={(event) => setSignupData((current) => ({ ...current, email: event.target.value }))} /> : null}
                                        {signupStep === 'name' ? <div className='grid grid-cols-2 gap-3'><FormInput autoFocus label='First name' autoComplete='given-name' placeholder='Jane' value={signupData.firstName} onChange={(event) => setSignupData((current) => ({ ...current, firstName: event.target.value }))} /><FormInput label='Last name' autoComplete='family-name' placeholder='Doe' value={signupData.lastName} onChange={(event) => setSignupData((current) => ({ ...current, lastName: event.target.value }))} /></div> : null}
                                        {signupStep === 'password' ? <><FormInput autoFocus label='Password' type='password' autoComplete='new-password' placeholder='At least 6 characters' value={signupData.password} onChange={(event) => setSignupData((current) => ({ ...current, password: event.target.value }))} /><FormInput label='Confirm password' type='password' autoComplete='new-password' placeholder='Re-enter your password' value={signupData.confirmPassword} onChange={(event) => setSignupData((current) => ({ ...current, confirmPassword: event.target.value }))} /></> : null}
                                        {authError ? <p className='rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive'>{authError}</p> : null}
                                    </div>
                                    <Button type='submit' loading={authLoading} className='mt-auto h-14 w-full rounded-2xl! mb-4'>{signupStep === 'password' ? <><Check /> Create account</> : <>Continue <ArrowRight /></>}</Button>
                                </form>
                            </>
                        )}
                        <p className='text-center text-[9px] leading-[1.45] text-muted-foreground'>
                            By continuing, you acknowledge our{' '}
                            <a href='https://sites.google.com/view/pack-it-privacy/home' target='_blank' rel='noreferrer' className='underline transition-colors hover:text-foreground'>Privacy Policy</a>.
                        </p>
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={loginOpen} onOpenChange={(open) => { if (!open) closeLogin() }}>
                <SheetContent side='bottom' className='data-[side=bottom]:h-[60svh] gap-0 overflow-y-auto rounded-t-[2rem] border-white/50 bg-background px-6 pb-[calc(env(safe-area-inset-bottom)_+_3rem)] pt-3 shadow-[0_-20px_70px_rgba(0,0,0,.22)]'>
                    <div className='mx-auto mb-8 h-1.5 w-11 rounded-full bg-foreground/10' />
                    <div className='mx-auto flex min-h-0 flex-1 flex-col w-full max-w-md'>
                        {loginStep === 'password' ? <button type='button' onClick={() => { setAuthError(''); setLoginStep('email'); setLoginData((current) => ({ ...current, password: '' })) }} className='mb-5 inline-flex size-10 items-center justify-center rounded-full bg-muted text-foreground transition active:scale-95' aria-label='Use a different email'><ArrowLeft className='size-4' /></button> : null}
                        <SheetHeader className='px-0 pb-6 pt-2'>
                            <p className='text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground'>Step {loginStep === 'email' ? 1 : 2} of 2</p>
                            <SheetTitle className='mt-2 text-2xl font-semibold tracking-tight'>{loginStep === 'email' ? 'Welcome back' : 'Enter your password'}</SheetTitle>
                            <SheetDescription className='mt-2 leading-6'>{loginStep === 'email' ? 'Log in to pick up where you left off.' : `Continue with ${loginData.email}.`}</SheetDescription>
                        </SheetHeader>
                        <form onSubmit={continueLogin} className='flex flex-1 flex-col' aria-busy={authLoading || !loginFormReady}>
                            <div className='space-y-4'>
                                {loginFormReady ? (loginStep === 'email' ? <FormInput autoFocus label='Email address' type='email' autoComplete='email' inputMode='email' placeholder='you@example.com' value={loginData.email} onChange={(event) => setLoginData((current) => ({ ...current, email: event.target.value }))} /> : <FormInput autoFocus label='Password' type='password' autoComplete='current-password' placeholder='Enter your password' value={loginData.password} onChange={(event) => setLoginData((current) => ({ ...current, password: event.target.value }))} />) : <div className='h-[4.5rem]' />}
                                {authError ? <p className='rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive'>{authError}</p> : null}
                            </div>
                            <div className='mt-auto mb-4 space-y-3'>
                                <Button type='submit' loading={authLoading} className='h-14 w-full rounded-2xl!'>{loginStep === 'email' ? <>Continue <ArrowRight /></> : <><LockKeyhole /> Log in</>}</Button>
                            </div>
                        </form>
                        <p className='text-center text-[9px] leading-[1.45] text-muted-foreground'>
                            By continuing, you acknowledge our{' '}
                            <a href='https://sites.google.com/view/pack-it-privacy/home' target='_blank' rel='noreferrer' className='underline transition-colors hover:text-foreground'>Privacy Policy</a>.
                        </p>
                    </div>
                </SheetContent>
            </Sheet>
        </main>
    )
}

export default Landing
