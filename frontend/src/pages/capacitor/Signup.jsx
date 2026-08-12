import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { Button } from '@/components/ui/button'
import FormInput from '@/components/common/FormInput'
import { createNewUserObject, createUserProfile } from '../../services/userService'
import PackItMark from '../../assets/logo_sm.png'

const Signup = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        if (Object.values(formData).some((value) => !value.trim())) {
            setError('Fill out each field to create your account.')
            return
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        try {
            setLoading(true)
            const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
            await createUserProfile(credential.user.uid, createNewUserObject({ uid: credential.user.uid, firstName: formData.firstName, lastName: formData.lastName, email: formData.email, profilePictureUrl: '' }))
            navigate('/home')
        } catch (signupError) {
            setError(signupError?.message ?? 'Unable to create your account right now. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className='min-h-svh bg-background pt-[calc(env(safe-area-inset-top)_+_1rem)] pr-[calc(env(safe-area-inset-right)_+_1.25rem)] pb-[calc(env(safe-area-inset-bottom)_+_2rem)] pl-[calc(env(safe-area-inset-left)_+_1.25rem)]'>
            <div className='mx-auto flex w-full max-w-sm flex-col'>
                <Button render={<Link to='/capacitor' />} nativeButton={false} variant='ghost' size='icon' className='-ml-2 rounded-full' aria-label='Back'><ArrowLeft /></Button>

                <section className='pt-8'>
                    <img src={PackItMark} alt='' className='size-11' />
                    <p className='mt-7 text-sm font-medium text-muted-foreground'>Create your account</p>
                    <h1 className='mt-2 text-3xl font-semibold tracking-tight'>Pack with more peace of mind.</h1>
                    <p className='mt-3 text-sm leading-6 text-muted-foreground'>A few details and your next trip starts taking shape.</p>
                </section>

                <form onSubmit={handleSubmit} className='mt-9 space-y-5' aria-busy={loading}>
                    <div className='grid grid-cols-2 gap-3'>
                        <FormInput label='First name' id='firstName' name='firstName' autoComplete='given-name' placeholder='Jane' value={formData.firstName} onChange={(event) => setFormData((current) => ({ ...current, firstName: event.target.value }))} />
                        <FormInput label='Last name' id='lastName' name='lastName' autoComplete='family-name' placeholder='Doe' value={formData.lastName} onChange={(event) => setFormData((current) => ({ ...current, lastName: event.target.value }))} />
                    </div>
                    <FormInput label='Email address' id='email' name='email' type='email' autoComplete='email' placeholder='you@example.com' value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} />
                    <FormInput label='Password' id='password' name='password' type='password' autoComplete='new-password' placeholder='At least 6 characters' value={formData.password} onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))} />
                    <FormInput label='Confirm password' id='confirmPassword' name='confirmPassword' type='password' autoComplete='new-password' placeholder='Re-enter your password' value={formData.confirmPassword} onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))} />
                    {error ? <p className='rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive'>{error}</p> : null}
                    <Button type='submit' loading={loading} className='h-12 w-full rounded-xl'>Create account <ArrowRight /></Button>
                </form>

                <p className='pb-2 pt-8 text-center text-sm text-muted-foreground'>Already have an account? <Link to='/capacitor/login' className='font-medium text-foreground underline underline-offset-4'>Log in</Link></p>
            </div>
        </main>
    )
}

export default Signup
