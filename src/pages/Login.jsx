import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Navbar from '../components/ui/Navbar'

const Login = () => {

	const navigate = useNavigate()
	const [formData, setFormData] = useState({ email: '', password: '' })
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const handleChange = (event) => {
		const { name, value } = event.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleSubmit = async (event) => {

		event.preventDefault()
		setError('')

		if(!formData.email || !formData.password) {
			setError('Please enter your email and password.')
			return
		}

		try {
			setLoading(true)
			await signInWithEmailAndPassword(auth, formData.email, formData.password)
			navigate('/home')
		} catch (authError) {
			setError(authError?.message ?? 'Unable to login right now. Please try again.')
		} finally {
			setLoading(false)
		}

	}

	return (
		<main className='min-h-screen bg-neutral4'>

			<Navbar />

			<div className='grid place-items-center px-4 py-12'>
				<Card className='w-full max-w-md flex flex-col gap-4'>
					
					<div className='flex flex-col gap-1'>
						<h1 className='text-2xl font-semibold text-neutral0'>Welcome back</h1>
						<p className='text-sm text-neutral1'>Log in to continue planning your packing list.</p>						
					</div>
	
					<form onSubmit={handleSubmit} className='flex flex-col gap-2'>
						<Input
							label='Email'
							id='email'
							name='email'
							type='email'
							placeholder='you@example.com'
							value={formData.email}
							onChange={handleChange}
						/>

						<Input
							label='Password'
							id='password'
							name='password'
							type='password'
							placeholder='••••••••'
							value={formData.password}
							onChange={handleChange}
						/>

						{error ? <p className='text-sm text-negative0'>{error}</p> : null}

						<Button type='submit' loading={loading} className='w-full mt-2'>
							Log In
						</Button>
					</form>

					<p className='text-sm text-neutral1'>
						New to Pack-It?{' '}
						<Link to='/signup' className='font-medium text-neutral0 hover:underline'>
							Create an account
						</Link>
					</p>

				</Card>
			</div>
			
		</main>
	)
}

export default Login
