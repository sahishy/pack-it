import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import FormInput from '@/components/common/FormInput'
import GoogleLogo from '@/assets/google.png'
import { useAuth } from '@/contexts/AuthContext'

const GuestAccountDialog = ({ open, onOpenChange }) => {
    const { upgradeGuest } = useAuth()
    const [step, setStep] = useState('email')
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const close = () => {
        setStep('email')
        setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
        setError('')
        onOpenChange(false)
    }

    const handleEmailContinue = (event) => {
        event.preventDefault()
        setError('')

        if (!formData.email.trim()) {
            setError('Please enter your email address.')
            return
        }

        setStep('details')
    }

    const returnToEmail = () => {
        setStep('email')
        setError('')
        setFormData((current) => ({ ...current, password: '', confirmPassword: '' }))
    }

    const submit = async (event) => {
        event.preventDefault()
        setError('')
        if (!formData.password) return setError('Please enter your password.')
        if (!formData.firstName.trim() || !formData.lastName.trim()) return setError('Please enter your first and last name.')
        if (formData.password.length < 6) return setError('Password must be at least 6 characters long.')
        if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.')

        try {
            setLoading(true)
            await upgradeGuest({ provider: 'email', ...formData })
            close()
        } catch (authError) {
            if (authError?.code === 'auth/email-already-in-use') {
                setError('That email already has an account. Use a different email to continue your guest data in a new account.')
            } else {
                setError(authError?.message ?? 'Unable to save your guest account right now.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleGoogle = async () => {
        try {
            setError('')
            setLoading(true)
            await upgradeGuest({ provider: 'google' })
            close()
        } catch (authError) {
            if (authError?.code === 'auth/credential-already-in-use') {
                setError('That Google account already has a Pack-It account. Choose a different Google account to continue your guest data.')
            } else {
                setError(authError?.message ?? 'Unable to continue with Google.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !loading) close() }}>
            <DialogContent className='block max-h-[min(680px,calc(100svh_-_32px))] w-[min(680px,calc(100%_-_32px))] max-w-[680px] overflow-hidden p-0 max-[800px]:max-h-[calc(100svh_-_20px)] max-[800px]:w-[min(620px,calc(100%_-_20px))] max-[800px]:rounded-[20px]'>
                <section className='flex min-h-0 max-h-[min(680px,calc(100svh_-_32px))] flex-col overflow-y-auto bg-transparent px-10 pb-7 pt-12 max-[800px]:max-h-[calc(100svh_-_20px)] max-[800px]:px-6 max-[800px]:pb-6 max-[420px]:px-5'>
                    <DialogHeader className='gap-0 pr-7'>
                        <DialogTitle className='text-[28px] font-[590] leading-[1.05] tracking-[-.04em] max-[800px]:text-[25px]'>Create an account</DialogTitle>
                        <DialogDescription className='mt-[11px] max-w-[360px] text-xs leading-[1.55] text-[#788085]'>
                            {step === 'email'
                                ? 'Create a new account to keep everything you made as a guest and continue using this feature.'
                                : `Enter your details to finish creating an account for ${formData.email}.`}
                        </DialogDescription>
                    </DialogHeader>

                    {step === 'email' ? (
                        <form onSubmit={handleEmailContinue} className='mt-7 flex flex-col gap-3.5 max-[800px]:mt-6 [&_[data-slot=button]_img]:size-[15px] [&_[data-slot=field-label]]:text-xs'>
                            {!Capacitor.isNativePlatform() ? (
                                <Button type='button' variant='outline' className='w-full' loading={loading} onClick={handleGoogle}>
                                    <img src={GoogleLogo} alt='' /> Create with Google
                                </Button>
                            ) : null}
                            {!Capacitor.isNativePlatform() ? <div className="flex items-center gap-3 text-[9px] uppercase tracking-[.08em] text-[#a0a5a4] before:h-px before:flex-1 before:bg-[#dedfdb] before:content-[''] after:h-px after:flex-1 after:bg-[#dedfdb] after:content-['']"><span>or create with email</span></div> : null}
                            <FormInput label='Email address' type='email' autoComplete='email' placeholder='you@example.com' value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} />
                            {error ? <p className='rounded-[9px] border border-red-600/14 bg-red-600/5 px-[11px] py-[9px] text-[11px] leading-[1.45] text-[#b42323]' role='alert'>{error}</p> : null}
                            <Button type='submit' className='w-full'>Continue <ArrowRight /></Button>
                        </form>
                    ) : (
                        <form onSubmit={submit} className='mt-7 flex flex-col gap-3.5 max-[800px]:mt-6 [&_[data-slot=field-label]]:text-xs'>
                            <div className='grid grid-cols-2 gap-2.5 max-[420px]:grid-cols-1'>
                                <FormInput label='First name' autoComplete='given-name' placeholder='Jane' value={formData.firstName} onChange={(event) => setFormData((current) => ({ ...current, firstName: event.target.value }))} />
                                <FormInput label='Last name' autoComplete='family-name' placeholder='Doe' value={formData.lastName} onChange={(event) => setFormData((current) => ({ ...current, lastName: event.target.value }))} />
                            </div>
                            <FormInput label='Password' type='password' autoComplete='new-password' placeholder='••••••••' value={formData.password} onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))} />
                            <FormInput label='Confirm password' type='password' autoComplete='new-password' placeholder='••••••••' value={formData.confirmPassword} onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))} />
                            {error ? <p className='rounded-[9px] border border-red-600/14 bg-red-600/5 px-[11px] py-[9px] text-[11px] leading-[1.45] text-[#b42323]' role='alert'>{error}</p> : null}
                            <Button type='submit' className='w-full' loading={loading}><Check /> Create account and continue</Button>
                            <Button type='button' variant='ghost' size='sm' onClick={returnToEmail} className='self-center'><ArrowLeft /> Use a different email</Button>
                        </form>
                    )}

                    <p className='mt-[25px] text-center text-[9px] leading-[1.45] text-[#a1a5a4]'>
                        By continuing, you acknowledge our{' '}
                        <a href='https://sites.google.com/view/pack-it-privacy/home' target='_blank' rel='noreferrer' className='underline transition-colors hover:text-[#707675]'>Privacy Policy</a>.
                    </p>
                </section>
            </DialogContent>
        </Dialog>
    )
}

export default GuestAccountDialog
