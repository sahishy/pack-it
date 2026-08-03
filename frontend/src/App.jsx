import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Landing from './pages/Landing'
import CapacitorLanding from './pages/capacitor/Landing'
import Login from './pages/Login'
import CapacitorLogin from './pages/capacitor/Login'
import Signup from './pages/Signup'
import CapacitorSignup from './pages/capacitor/Signup'
import Home from './pages/Home'
import Tools from './pages/Tools'
import Settings from './pages/Settings'
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
import LoadingScreen from '@/components/common/LoadingScreen'
import AppShell from '@/components/layout/AppShell'
import Suitcases from './pages/Suitcases'
import NewSuitcase from './pages/NewSuitcase'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicOnlyRoute from './routes/PublicOnlyRoute'
import StartupRedirect from './routes/StartupRedirect'

const resolveTheme = (preference) => {

	if(preference === 'light' || preference === 'dark') {
		return preference
	}

	// return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
	return 'light';
	
}

const ScrollToTop = () => {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }, [pathname])

    return null
}

const App = () => {
	const { profile } = useAuth()

	useEffect(() => {
		const preference = profile?.preferences?.theme ?? 'system'
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

		const applyTheme = () => {
			document.documentElement.dataset.theme = resolveTheme(preference)
		}

		applyTheme()

		if(preference !== 'system') {
			return undefined
		}

		const handleSystemThemeChange = () => applyTheme()

		mediaQuery.addEventListener('change', handleSystemThemeChange)
		return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
	}, [profile?.preferences?.theme])

	return (
		<>
			<ScrollToTop />
			<Routes>

			<Route
				path='/'
				element={<StartupRedirect />}
			/>

			<Route
				path='/landing'
				element={
					<PublicOnlyRoute>
						<Landing />
					</PublicOnlyRoute>
				}
			/>

			<Route
				path='/capacitor'
				element={
					<PublicOnlyRoute>
						<CapacitorLanding />
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
				path='/capacitor/login'
				element={
					<PublicOnlyRoute>
						<CapacitorLogin />
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
				path='/capacitor/signup'
				element={
					<PublicOnlyRoute>
						<CapacitorSignup />
					</PublicOnlyRoute>
				}
			/>

			<Route
				element={
					<ProtectedRoute>
						<AppShell />
					</ProtectedRoute>
				}
			>
				<Route path='/home' element={<Home />} />
				<Route path='/suitcases' element={<Suitcases />} />
				<Route path='/tools' element={<Tools />} />
				<Route path='/settings' element={<Settings />} />
				<Route path='/tools/tip-calculator' element={<TipCalculator />} />
				<Route path='/tools/currency-converter' element={<CurrencyConverter />} />
				<Route path='/tools/plug-guide' element={<PlugGuide />} />
				<Route path='/tools/unit-converter' element={<UnitConverter />} />
				<Route path='/tools/liquid-checker' element={<LiquidChecker />} />
				<Route path='/tools/emergency-info' element={<EmergencyInfo />} />
				<Route path='/suitcases/new' element={<NewSuitcase />} />
				<Route path='/trips/new' element={<NewTrip />} />
				<Route path='/trips/:tripId/edit' element={<EditTrip />} />
				<Route path='/trips/:tripId' element={<TripOverview />} />
				<Route path='/trips/:tripId/plan' element={<PlanOverview />} />
				<Route path='/trips/:tripId/plan/strategy' element={<StrategyOverview />} />
			</Route>
			
			<Route path='*' element={<Navigate to='/' replace />} />

			</Routes>
		</>

	)

}

export default App
