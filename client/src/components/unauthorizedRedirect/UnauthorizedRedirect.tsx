import { Outlet, useNavigate } from 'react-router-dom';
import { routes } from '../../routes';
import { unauthorizedResponseEvent } from '../../api/authenticationEvents';
import { useEffect } from 'react';

const UnauthorizedRedirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const redirectToSignIn = () => navigate(routes.signIn, { replace: true });

        window.addEventListener(unauthorizedResponseEvent, redirectToSignIn);
        return () => window.removeEventListener(unauthorizedResponseEvent, redirectToSignIn);
    }, [navigate]);

    return <Outlet />;
};

export default UnauthorizedRedirect;
