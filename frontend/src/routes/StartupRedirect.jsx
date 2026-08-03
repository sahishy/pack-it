import { Capacitor } from '@capacitor/core'
import { Navigate } from 'react-router-dom'

const StartupRedirect = () => {
    const destination = Capacitor.isNativePlatform() ? '/capacitor' : '/landing'

    return <Navigate to={destination} replace />
}

export default StartupRedirect