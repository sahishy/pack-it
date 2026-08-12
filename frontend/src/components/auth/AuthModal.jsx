import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { auth, googleProvider } from '@/lib/firebase'
import { createNewUserObject, createUserProfile } from '@/services/userService'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import FormInput from '@/components/common/FormInput'
import GoogleLogo from '@/assets/google.png'

const emptyForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
}

const getNameFromUser = (user) => {
    const fullName = user?.displayName?.trim() ?? ''
    if (fullName) {
        const nameParts = fullName.split(/\s+/).filter(Boolean)
        return { firstName: nameParts[0] ?? 'User', lastName: nameParts.slice(1).join(' ') }
    }

    return { firstName: user?.email?.split('@')?.[0] ?? 'User', lastName: '' }
}

const friendlyAuthError = (error, mode) => {
    if (error?.code === 'auth/popup-closed-by-user') return `Google ${mode === 'login' ? 'sign-in' : 'sign-up'} was canceled.`
    if (error?.code === 'auth/cancelled-popup-request') return 'A Google request is already in progress. Please try again.'
    if (error?.code === 'auth/invalid-credential') return 'That email or password does not look right.'
    if (error?.code === 'auth/email-already-in-use') return 'An account already exists for this email.'
    return error?.message ?? `Unable to ${mode === 'login' ? 'log in' : 'create your account'} right now.`
}

const AuthModal = ({ mode, onClose, onModeChange }) => {
    const navigate = useNavigate()
    const [step, setStep] = useState('email')
    const [formData, setFormData] = useState(emptyForm)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const isSignup = mode === 'signup'

    useEffect(() => {
        setStep('email')
        setError('')
        setFormData(emptyForm)
    }, [mode])

    const handleChange = (event) => {
        const { name, value } = event.target
        setFormData((current) => ({ ...current, [name]: value }))
    }

    const handleEmailContinue = (event) => {
        event.preventDefault()
        setError('')

        if (!formData.email.trim()) {
            setError('Please enter your email address.')
            return
        }

        setStep(isSignup ? 'details' : 'password')
    }

    const handleGoogleContinue = async () => {
        if (loading) return
        setError('')
        setLoading(true)

        try {
            const credential = await signInWithPopup(auth, googleProvider)
            const { firstName, lastName } = getNameFromUser(credential.user)
            const profile = createNewUserObject({
                uid: credential.user.uid,
                firstName,
                lastName,
                email: credential.user.email ?? '',
                profilePictureUrl: credential.user.photoURL ?? '',
            })
            await createUserProfile(credential.user.uid, profile, { merge: true })
            navigate('/home')
        } catch (authError) {
            setError(friendlyAuthError(authError, mode))
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')

        if (!formData.password) {
            setError('Please enter your password.')
            return
        }

        if (isSignup) {
            if (!formData.firstName.trim() || !formData.lastName.trim()) {
                setError('Please enter your first and last name.')
                return
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters long.')
                return
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match.')
                return
            }
        }

        setLoading(true)
        try {
            if (isSignup) {
                const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
                const profile = createNewUserObject({
                    uid: credential.user.uid,
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    email: formData.email,
                    profilePictureUrl: '',
                })
                await createUserProfile(credential.user.uid, profile)
            } else {
                await signInWithEmailAndPassword(auth, formData.email, formData.password)
            }
            navigate('/home')
        } catch (authError) {
            setError(friendlyAuthError(authError, mode))
        } finally {
            setLoading(false)
        }
    }

    const returnToEmail = () => {
        setStep('email')
        setError('')
        setFormData((current) => ({ ...current, password: '', confirmPassword: '' }))
    }

    return (
        <Dialog open={Boolean(mode)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className='block max-h-[min(680px,calc(100svh_-_32px))] w-[min(460px,calc(100%_-_32px))] max-w-[460px] overflow-hidden p-0 max-[800px]:max-h-[calc(100svh_-_20px)] max-[800px]:w-[min(440px,calc(100%_-_20px))] max-[800px]:rounded-[20px]'>
                <section className='flex min-h-0 max-h-[min(680px,calc(100svh_-_32px))] flex-col overflow-y-auto bg-transparent px-10 pt-12 pb-7 max-[800px]:max-h-[calc(100svh_-_20px)] max-[800px]:px-6 max-[800px]:pb-6 max-[420px]:px-5'>
                    <DialogHeader className='gap-0'>
                        <DialogTitle className='text-[28px] leading-[1.05] font-[590] tracking-[-.04em] max-[800px]:text-[25px]'>{isSignup ? 'Create your account' : 'Welcome back'}</DialogTitle>
                        <DialogDescription className='mt-[11px] max-w-[360px] text-xs leading-[1.55] text-[#788085]'>
                            {step === 'email'
                                ? (isSignup ? 'Create an account to organize your trips and packing lists.' : 'Log in to access your trips and packing lists.')
                                : (isSignup ? 'Enter your details to finish creating your account.' : `Enter the password for ${formData.email}.`)}
                        </DialogDescription>
                    </DialogHeader>

                    {step === 'email' ? (
                        <form onSubmit={handleEmailContinue} className='mt-7 flex flex-col gap-3.5 max-[800px]:mt-6 [&_[data-slot=button]_img]:size-[15px] [&_[data-slot=field-label]]:text-xs'>
                            {!Capacitor.isNativePlatform() && (
                                <Button type='button' variant='outline' onClick={handleGoogleContinue} loading={loading} className='w-full'>
                                    <img src={GoogleLogo} alt='' /> Continue with Google
                                </Button>
                            )}
                            <div className="flex items-center gap-3 text-[9px] tracking-[.08em] text-[#a0a5a4] uppercase before:h-px before:flex-1 before:bg-[#dedfdb] before:content-[''] after:h-px after:flex-1 after:bg-[#dedfdb] after:content-['']"><span>or continue with email</span></div>
                            <FormInput
                                label='Email address'
                                id={`${mode}-email`}
                                name='email'
                                type='email'
                                autoComplete='email'
                                placeholder='you@example.com'
                                value={formData.email}
                                onChange={handleChange}
                            />
                            {error && <p className='rounded-[9px] border border-red-600/14 bg-red-600/5 px-[11px] py-[9px] text-[11px] leading-[1.45] text-[#b42323]' role='alert'>{error}</p>}
                            <Button type='submit' loading={loading} className='w-full'>Continue <ArrowRight /></Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className='mt-7 flex flex-col gap-3.5 max-[800px]:mt-6 [&_[data-slot=button]_img]:size-[15px] [&_[data-slot=field-label]]:text-xs'>
                            {isSignup && (
                                <div className='grid grid-cols-2 gap-2.5 max-[420px]:grid-cols-1'>
                                    <FormInput label='First name' id='auth-first-name' name='firstName' autoComplete='given-name' placeholder='Jane' value={formData.firstName} onChange={handleChange} />
                                    <FormInput label='Last name' id='auth-last-name' name='lastName' autoComplete='family-name' placeholder='Doe' value={formData.lastName} onChange={handleChange} />
                                </div>
                            )}
                            <FormInput label='Password' id={`${mode}-password`} name='password' type='password' autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder='••••••••' value={formData.password} onChange={handleChange} />
                            {isSignup && <FormInput label='Confirm password' id='auth-confirm-password' name='confirmPassword' type='password' autoComplete='new-password' placeholder='••••••••' value={formData.confirmPassword} onChange={handleChange} />}
                            {error && <p className='rounded-[9px] border border-red-600/14 bg-red-600/5 px-[11px] py-[9px] text-[11px] leading-[1.45] text-[#b42323]' role='alert'>{error}</p>}
                            <Button type='submit' loading={loading} className='w-full'>
                                {isSignup ? <><Check /> Create account</> : <><LockKeyhole /> Log in</>}
                            </Button>
                            <Button type='button' variant='ghost' size='sm' onClick={returnToEmail} className='self-center'><ArrowLeft /> Use a different email</Button>
                        </form>
                    )}

                    <div className='mt-auto pt-[25px] text-center text-[11px] text-[#858c8f] [&_[data-slot=button]]:ml-0.5 [&_[data-slot=button]]:align-baseline'>
                        {isSignup ? 'Already have an account?' : 'New to Pack-It?'}
                        <Button type='button' variant='link' size='xs' onClick={() => onModeChange(isSignup ? 'login' : 'signup')}>
                            {isSignup ? 'Log in' : 'Create an account'}
                        </Button>
                    </div>
                    <p className='mt-3.5 text-center text-[9px] leading-[1.45] text-[#a1a5a4]'>
                        By continuing, you acknowledge our{' '}
                        <a href='https://sites.google.com/view/pack-it-privacy/home' target='_blank' rel='noreferrer' className='underline transition-colors hover:text-[#707675]'>Privacy Policy</a>.
                    </p>
                </section>
            </DialogContent>
        </Dialog>
    )
}

export default AuthModal
