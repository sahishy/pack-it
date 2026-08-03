import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { Button } from '@/components/ui/button'
import FormInput from '@/components/common/FormInput'
import PackItMark from '../../assets/logo_sm.png'

const Login = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        if (!formData.email || !formData.password) {
            setError('Enter your email address and password to continue.')
            return
        }

        try {
            setLoading(true)
            await signInWithEmailAndPassword(auth, formData.email, formData.password)
            navigate('/home')
        } catch (authError) {
            setError(authError?.message ?? 'Unable to log in right now. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className='capacitor-safe-area min-h-svh bg-background'>
            <div className='mx-auto flex min-h-[calc(100svh-max(3rem,env(safe-area-inset-top))-max(2rem,env(safe-area-inset-bottom)))] w-full max-w-sm flex-col'>
                <Button render={<Link to='/capacitor' />} nativeButton={false} variant='ghost' size='icon' className='-ml-2 rounded-full' aria-label='Back'><ArrowLeft /></Button>

                <section className='pt-12'>
                    <img src={PackItMark} alt='' className='size-11' />
                    <p className='mt-8 text-sm font-medium text-muted-foreground'>Welcome back</p>
                    <h1 className='mt-2 text-3xl font-semibold tracking-tight'>Pick up where you left off.</h1>
                    <p className='mt-3 text-sm leading-6 text-muted-foreground'>Log in to continue building thoughtful packing lists.</p>
                </section>

                <form onSubmit={handleSubmit} className='mt-10 space-y-5' aria-busy={loading}>
                    <FormInput label='Email address' id='email' name='email' type='email' autoComplete='email' placeholder='you@example.com' value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} />
                    <FormInput label='Password' id='password' name='password' type='password' autoComplete='current-password' placeholder='Enter your password' value={formData.password} onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))} />
                    <div className='flex justify-end'><a href='#' className='text-sm font-medium text-foreground underline-offset-4 hover:underline'>Forgot password?</a></div>
                    {error ? <p className='rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive'>{error}</p> : null}
                    <Button type='submit' loading={loading} className='h-12 w-full rounded-xl'><LockKeyhole /> Log in</Button>
                </form>

                <p className='mt-auto pt-10 text-center text-sm text-muted-foreground'>New to Pack-It? <Link to='/capacitor/signup' className='font-medium text-foreground underline underline-offset-4'>Create an account</Link></p>
            </div>
        </main>
    )
}

export default Login
