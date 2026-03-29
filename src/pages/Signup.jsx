import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Navbar from '../components/ui/Navbar'
import { createNewUserObject, createUserProfile } from '../services/userService'
import { PiHandWavingFill } from 'react-icons/pi'
import GoogleLogo from '../assets/google.png'

const getNameFromUser = (user) => {
	const fullName = user?.displayName?.trim() ?? ''

	if (fullName) {
		const nameParts = fullName.split(/\s+/).filter(Boolean)
		return {
			firstName: nameParts[0] ?? 'User',
			lastName: nameParts.slice(1).join(' '),
		}
	}

	const emailPrefix = user?.email?.split('@')?.[0] ?? 'user'
	return {
		firstName: emailPrefix,
		lastName: '',
	}
}

const Signup = () => {

	const navigate = useNavigate()
	const [step, setStep] = useState('email')
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

	const handleEmailContinue = (event) => {

		event.preventDefault()
		setError('')

		if (!formData.email) {
			setError('Please enter your email address.')
			return
		}

		setStep('details')

	}

	const handleGoogleContinue = async () => {
		if (loading) {
			return
		}

		setError('')
		setLoading(true)

		try {
			const credential = await signInWithPopup(auth, googleProvider)
			const { firstName, lastName } = getNameFromUser(credential.user)
			const newUser = createNewUserObject({
				uid: credential.user.uid,
				firstName,
				lastName,
				email: credential.user.email ?? '',
				profilePictureUrl: credential.user.photoURL ?? '',
			})

			await createUserProfile(credential.user.uid, newUser, { merge: true })
			navigate('/home')
		} catch (signupError) {
			if (signupError?.code === 'auth/popup-closed-by-user') {
				setError('Google sign-up was canceled.')
				return
			}

			if (signupError?.code === 'auth/cancelled-popup-request') {
				setError('A Google sign-up request is already in progress. Please try again.')
				return
			}

			setError(signupError?.message ?? 'Unable to continue with Google right now. Please try again.')
		} finally {
			setLoading(false)
		}

	}

	const handleSubmit = async (event) => {

		event.preventDefault()
		setError('')

		if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
			setError('Please fill out all fields.')
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

		try {
			setLoading(true)
			const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
			const newUser = createNewUserObject({
				uid: credential.user.uid,
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
				profilePictureUrl: '',
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
				<Card className='w-full max-w-lg flex flex-col gap-6'>

					<div className='flex flex-col gap-3 items-center'>
						<div className='justify-self-center p-4 bg-linear-to-t from-primary0 to-primary1 rounded-full'>
							<PiHandWavingFill className='text-neutral5 text-3xl' />
						</div>
						<div className='flex flex-col gap-1 text-center'>
							<h1 className='text-2xl font-semibold text-neutral0'>Create your account</h1>
							<p className='text-sm text-neutral1'>Start building smarter packing lists for every trip.</p>
						</div>
					</div>

					{step === 'email' ? (
						<form onSubmit={handleEmailContinue} className='flex flex-col gap-3'>
							<Button
								type='button'
								variant='secondary'
								onClick={handleGoogleContinue}
								loading={loading}
								className='w-full flex gap-3'
							>
								<img src={GoogleLogo} alt='Google logo' className='h-4 w-4' />
								Continue with Google
							</Button>

							<div className='flex items-center gap-3'>
								<hr className='w-full border-neutral3'></hr>
								<p className='text-center text-sm text-neutral1 font-medium'>or</p>
								<hr className='w-full border-neutral3'></hr>
							</div>

							<Input
								id='email'
								name='email'
								type='email'
								placeholder='Enter email address'
								value={formData.email}
								onChange={handleChange}
							/>

							{error ? <p className='text-sm text-negative0'>{error}</p> : null}

							<Button type='submit' loading={loading} className='w-full'>
								Continue
							</Button>
						</form>
					) : (
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

							<Button
								type='button'
								variant='secondary'
								onClick={() => {
									setStep('email')
									setError('')
									setFormData((prev) => ({
										...prev,
										firstName: '',
										lastName: '',
										password: '',
										confirmPassword: '',
									}))
								}}
								className='w-full'
							>
								Use a different email
							</Button>
						</form>
					)}

					<p className='text-sm text-neutral1 text-center'>
						Already have an account?{' '}
						<Link to='/login' className='font-medium text-neutral0 hover:underline'>
							Log in
						</Link>
					</p>

					<p className='text-xs text-neutral1 text-center'>
						By continuing, you agree to Pack-It's{' '}
						<a href='#' className='underline hover:text-neutral0'>
							Terms of Service
						</a>{' '}
						and{' '}
						<a href='#' className='underline hover:text-neutral0'>
							Privacy Policy
						</a>
						.
					</p>

				</Card>
			</div>

		</main>
	)
}

export default Signup
