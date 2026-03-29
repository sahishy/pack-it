import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Navbar from '../components/ui/Navbar'
import { createNewUserObject, createUserProfile } from '../services/userService'

const Signup = () => {

	const navigate = useNavigate()
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		confirmPassword: '',
	})
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const handleChange = (event) => {
		const { name, value } = event.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleSubmit = async (event) => {

		event.preventDefault()
		setError('')

		if(!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
			setError('Please fill out all fields.')
			return
		}

		if(formData.password.length < 6) {
			setError('Password must be at least 6 characters long.')
			return
		}

		if(formData.password !== formData.confirmPassword) {
			setError('Passwords do not match.')
			return
		}

		try {
			setLoading(true)
			const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
			const newUser = createNewUserObject({
				uid: credential.user.uid,
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
			})

			await createUserProfile(credential.user.uid, newUser)
			navigate('/home')
		} catch (signupError) {
			setError(signupError?.message ?? 'Unable to create account right now. Please try again.')
		} finally {
			setLoading(false)
		}

	}

	return (
		<main className='min-h-screen bg-neutral4'>

			<Navbar />

			<div className='grid place-items-center px-4 py-10'>
				<Card className='w-full max-w-md flex flex-col gap-4'>

					<div className='flex flex-col gap-1'>
						<h1 className='text-2xl font-semibold text-neutral0'>Create your account</h1>
						<p className='text-sm text-neutral1'>Start building smarter packing lists for every trip.</p>					
					</div>

					<form onSubmit={handleSubmit} className='flex flex-col gap-2'>
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							<Input
								label='First name'
								id='firstName'
								name='firstName'
								placeholder='Jane'
								value={formData.firstName}
								onChange={handleChange}
							/>
							<Input
								label='Last name'
								id='lastName'
								name='lastName'
								placeholder='Doe'
								value={formData.lastName}
								onChange={handleChange}
							/>
						</div>

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
							placeholder='At least 6 characters'
							value={formData.password}
							onChange={handleChange}
						/>

						<Input
							label='Confirm password'
							id='confirmPassword'
							name='confirmPassword'
							type='password'
							placeholder='Re-enter password'
							value={formData.confirmPassword}
							onChange={handleChange}
						/>

						{error ? <p className='text-sm text-negative0'>{error}</p> : null}

						<Button type='submit' loading={loading} className='w-full mt-2'>
							Sign Up
						</Button>
					</form>

					<p className='text-sm text-neutral1'>
						Already have an account?{' '}
						<Link to='/login' className='font-medium text-neutral0 hover:underline'>
							Log in
						</Link>
					</p>

				</Card>
			</div>
			
		</main>
	)
}

export default Signup
