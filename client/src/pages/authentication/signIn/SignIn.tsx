import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AuthLayout from '../../../components/authLayout/AuthLayout';
import Icon from '../../../components/icon/Icon';
import { JobTrackerAPIError } from '../../../api/models';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import type { SubmitEvent } from 'react';
import { routes } from '../../../routes';
import styles from '../Authentication.module.css';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useToast } from '../../../components/toast/ToastProvider';
import { getErrorMessage } from '../../../helper/getErrorMessage';

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const [visible, setVisibility] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const api = useJobTrackerAPI();
    const { showErrorToast } = useToast();

    // Wake the free-tier backend before the user submits the form.
    useEffect(() => {
        void api.ping.wake();
    }, [api.ping]);

    useEffect(() => {
        if (location.state?.fromLogout) {
            return;
        }

        const verifyAuth = async () => {
            try {
                await api.authentication.verify();
                navigate(routes.viewApplications, { replace: true });
            } catch {
                // no valid token, stay on sign in
            }
        };
        void verifyAuth();
    }, [api.authentication, navigate]);

    const handleSignIn = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsPending(true);

        try {
            await api.authentication.signIn({ email, password });
            navigate(routes.addApplication);
        } catch (error) {
            if (error instanceof JobTrackerAPIError) {
                showErrorToast(error.message);
                return;
            }
            showErrorToast(getErrorMessage(error));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <AuthLayout>
            <div className={styles.card}>
                <Icon name='briefcase' className={styles.logoIcon} />
                <h2 className={styles.title}>Sign in to Job Tracker</h2>
                <form onSubmit={handleSignIn}>
                    <label htmlFor='email'>Email</label>
                    <div className={styles.inputBox}>
                        <Icon name='email' className={styles.leftIcon} />
                        <input
                            id='email'
                            type='email'
                            autoComplete='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <label htmlFor='password'>Password</label>
                    <div className={styles.passwordWrapper}>
                        <Icon name='lock' className={styles.leftIcon} />
                        <input
                            id='password'
                            type={visible ? 'text' : 'password'}
                            autoComplete='current-password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <PrimaryButton
                            type='button'
                            variant='icon'
                            className={styles.toggleVisibility}
                            aria-label={visible ? 'Hide password' : 'Show password'}
                            onClick={() => setVisibility((isVisible) => !isVisible)}
                        >
                            <Icon name={visible ? 'visibility' : 'visibilityOff'} />
                        </PrimaryButton>
                    </div>

                    {isPending ? (
                        <PrimaryButton variant='form' type='submit' disabled>
                            <LoadingSpinner size='sm' variant='light' />
                        </PrimaryButton>
                    ) : (
                        <PrimaryButton variant='form' type='submit'>
                            Sign in
                        </PrimaryButton>
                    )}

                    <Link className={styles.authLink} to={routes.signUp}>
                        Don’t have an account? Create one
                    </Link>
                </form>
                <div className={styles.noticeWrapper}>
                    <span className={styles.noticeIcon}>
                        <Icon name='alert' />
                    </span>
                    The free-tier server may take up to 50 seconds to wake up. Please wait after clicking Sign in
                </div>
                <Link className={styles.userGuideLink} to={routes.userGuide} target='_blank'>
                    View user guide
                </Link>
            </div>
        </AuthLayout>
    );
};

export default SignIn;
