import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'

const ProtectedRoute = ({ children }) => {

	const { user, loading } = useAuth()

	if(loading) {
		return <div className='min-h-screen grid place-items-center bg-neutral4 text-neutral1'>Loading...</div>
	}
	if(!user) {
		return <Navigate to='/login' replace />
	}

	return children

}

const PublicOnlyRoute = ({ children }) => {

	const { user, loading } = useAuth()

	if(loading) {
		return <div className='min-h-screen grid place-items-center bg-neutral4 text-neutral1'>Loading...</div>
	}
	if(user) {
		return <Navigate to='/home' replace />
	}

	return children

}

const App = () => {

	return (
		<Routes>

			<Route
				path='/'
				element={
					<PublicOnlyRoute>
						<Landing />
					</PublicOnlyRoute>
				}
			/>

			<Route
				path='/login'
				element={
					<PublicOnlyRoute>
						<Login />
					</PublicOnlyRoute>
				}
			/>

			<Route
				path='/signup'
				element={
					<PublicOnlyRoute>
						<Signup />
					</PublicOnlyRoute>
				}
			/>

			<Route
				path='/home'
				element={
					<ProtectedRoute>
						<Home />
					</ProtectedRoute>
				}
			/>
			
			<Route path='*' element={<Navigate to='/' replace />} />

		</Routes>

	)

}

export default App
