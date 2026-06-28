import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import FallbackScreen from '../fallbackScreen/FallbackScreen';
import { JobTrackerAPIError } from '../../api/models';
import { routes } from '../../routes';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useToast } from '../toast/ToastProvider';
import { getErrorToastMessage } from '../../helper/getErrorToastMessage';

const ProtectedRoutes = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);
    const [authenticationError, setAuthenticationError] = useState(false);
    const api = useJobTrackerAPI();
    const { showErrorToast } = useToast();

    const checkIsAuth = async () => {
        setAuthenticationError(false);
        setIsAuthenticated(undefined);

        try {
            await api.authentication.verify();
            setIsAuthenticated(true);
        } catch (error) {
            const isUnauthenticated =
                error instanceof JobTrackerAPIError &&
                (error.status === 401 || error.message === 'The API returned an unexpected HTML page.');

            if (isUnauthenticated) {
                setIsAuthenticated(false);
                return;
            }

            setAuthenticationError(true);
            showErrorToast(getErrorToastMessage(error, 'Unable to verify authentication. Please try again.'));
        }
    };

    useEffect(() => {
        void checkIsAuth();
    }, [api.authentication]);

    if (authenticationError) {
        return <FallbackScreen variant='authenticationError' onAction={() => void checkIsAuth()} />;
    }

    // Wait for auth check to complete before rendering
    // Without this, component renders with default false state
    // and immediately redirects to login before API call finishes
    if (isAuthenticated === undefined) {
        return <FallbackScreen variant='loading' />;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to={routes.signIn} replace />;
};

export default ProtectedRoutes;
