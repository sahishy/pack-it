import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import NewTrip from './pages/NewTrip'
import TripOverview from './pages/TripOverview'
import PlanOverview from './pages/PlanOverview'
import StrategyOverview from './pages/StrategyOverview'
import LoadingScreen from './components/ui/LoadingScreen'

const ProtectedRoute = ({ children }) => {

	const { user, loading } = useAuth()

	if(loading) {
		return <LoadingScreen className='bg-neutral4' />
	}
	if(!user) {
		return <Navigate to='/login' replace />
	}

	return children

}

const PublicOnlyRoute = ({ children }) => {

	const { user, loading } = useAuth()

	if(loading) {
		return <LoadingScreen className='bg-neutral4' />
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

			<Route
				path='/trips/new'
				element={
					<ProtectedRoute>
						<NewTrip />
					</ProtectedRoute>
				}
			/>

			<Route
				path='/trips/:tripId'
				element={
					<ProtectedRoute>
						<TripOverview />
					</ProtectedRoute>
				}
			/>

			<Route
				path='/trips/:tripId/plan'
				element={
					<ProtectedRoute>
						<PlanOverview />
					</ProtectedRoute>
				}
			/>

			<Route
				path='/trips/:tripId/plan/strategy'
				element={
					<ProtectedRoute>
						<StrategyOverview />
					</ProtectedRoute>
				}
			/>
			
			<Route path='*' element={<Navigate to='/' replace />} />

		</Routes>

	)

}

export default App
