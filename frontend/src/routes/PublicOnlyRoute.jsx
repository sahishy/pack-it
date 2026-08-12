import { Navigate } from 'react-router-dom'
import LoadingScreen from '@/components/common/LoadingScreen'
import { useAuth } from '../contexts/AuthContext'

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

export default PublicOnlyRoute
