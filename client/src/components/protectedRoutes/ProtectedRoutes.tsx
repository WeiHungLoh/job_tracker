import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { JobTrackerAPIError } from '../../api/models'
import LoadingSpinner from '../loadingSpinner/LoadingSpinner'
import { routes } from '../../routes'
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI'
import { useToast } from '../toast/ToastProvider'

const ProtectedRoutes = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined)
    const [authenticationError, setAuthenticationError] = useState(false)
    const api = useJobTrackerAPI()
    const { showErrorToast } = useToast()

    const checkIsAuth = async () => {
        setAuthenticationError(false)
        setIsAuthenticated(undefined)

        try {
            await api.authentication.verify()
            setIsAuthenticated(true)
        } catch (error) {
            const isUnauthenticated = error instanceof JobTrackerAPIError && (
                error.status === 401 ||
                error.message === 'The API returned an unexpected HTML page.'
            )

            if (isUnauthenticated) {
                setIsAuthenticated(false)
                return
            }

            setAuthenticationError(true)
            showErrorToast(error instanceof Error ? error.message : 'Unable to verify authentication.')
        }
    }

    useEffect(() => {
        checkIsAuth()
    }, [api.authentication])

    if (authenticationError) {
        return (
            <div>
                Unable to verify authentication. Please try again.
                <button onClick={() => void checkIsAuth()} type='button'>Try again</button>
            </div>
        )
    }

    // Wait for auth check to complete before rendering
    // Without this, component renders with default false state
    // and immediately redirects to login before API call finishes
    if (isAuthenticated === undefined) {
        return <div
            style={{
                textAlign: 'center',
                marginTop: '50px',
                fontSize: '24px'
            }}>
                Checking authentication status...
                <LoadingSpinner style={{height: '36px', width: '36px'}}/>
        </div>
    }

    return isAuthenticated ? <Outlet /> : <Navigate to={routes.signIn} replace />
}

export default ProtectedRoutes
