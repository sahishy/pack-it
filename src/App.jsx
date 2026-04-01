import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Tools from './pages/Tools'
import TipCalculator from './pages/tools/TipCalculator'
import CurrencyConverter from './pages/tools/CurrencyConverter'
import PlugGuide from './pages/tools/PlugGuide'
import UnitConverter from './pages/tools/UnitConverter'
import LiquidChecker from './pages/tools/LiquidChecker'
import EmergencyInfo from './pages/tools/EmergencyInfo'
import NewTrip from './pages/NewTrip'
import EditTrip from './pages/EditTrip'
import TripOverview from './pages/TripOverview'
import PlanOverview from './pages/PlanOverview'
import StrategyOverview from './pages/StrategyOverview'
import LoadingScreen from './components/ui/LoadingScreen'
import Topbar from './components/ui/Topbar'
import BottomBar from './components/ui/BottomBar'

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

const ProtectedTopbarLayout = () => {

	const location = useLocation()
	const { user, profile, logout } = useAuth()
	const displayName = profile?.firstName ? `${profile.firstName} ${profile?.lastName ?? ''}`.trim() : user.email
	const showBottomBar = location.pathname.startsWith('/home') || location.pathname.startsWith('/tools')

	return (
		<>
			<Topbar displayName={displayName} email={user.email} onLogout={logout} />
			<div className={showBottomBar ? 'pb-32 lg:pb-0' : ''}>
				<Outlet />
			</div>
			{showBottomBar ? <BottomBar /> : null}
		</>
	)

}

const ScrollToTop = () => {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }, [pathname])

    return null
}

const App = () => {

	return (
		<>
			<ScrollToTop />
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
				element={
					<ProtectedRoute>
						<ProtectedTopbarLayout />
					</ProtectedRoute>
				}
			>
				<Route path='/home' element={<Home />} />
				<Route path='/tools' element={<Tools />} />
				<Route path='/tools/tip-calculator' element={<TipCalculator />} />
				<Route path='/tools/currency-converter' element={<CurrencyConverter />} />
				<Route path='/tools/plug-guide' element={<PlugGuide />} />
				<Route path='/tools/unit-converter' element={<UnitConverter />} />
				<Route path='/tools/liquid-checker' element={<LiquidChecker />} />
				<Route path='/tools/emergency-info' element={<EmergencyInfo />} />
			</Route>

			<Route
				path='/trips/new'
				element={
					<ProtectedRoute>
						<NewTrip />
					</ProtectedRoute>
				}
			/>

			<Route
				path='/trips/:tripId/edit'
				element={
					<ProtectedRoute>
						<EditTrip />
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
		</>

	)

}

export default App
