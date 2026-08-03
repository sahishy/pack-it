import { Navigate } from 'react-router-dom'
import LoadingScreen from '@/components/common/LoadingScreen'
import { useAuth } from '../contexts/AuthContext'

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

export default ProtectedRoute
