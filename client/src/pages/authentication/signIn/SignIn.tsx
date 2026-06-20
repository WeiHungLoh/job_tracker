import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AuthLayout from '../../../components/authLayout/AuthLayout';
import type { FormEvent } from 'react';
import Icon from '../../../components/icon/Icon';
import { JobTrackerAPIError } from '../../../api/models';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { routes } from '../../../routes';
import styles from '../Authentication.module.css';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useToast } from '../../../components/toast/ToastProvider';

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [visible, setVisiblity] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const api = useJobTrackerAPI();
    const { showErrorToast } = useToast();

    // Dummy fetch request to wake backend hosted on free tier
    useEffect(() => {
        void api.ping.wake();
    }, [api.ping]);

    const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        try {
            await api.authentication.signIn({ email, password });
            setIsPending(false);

            navigate(routes.addApplication);
        } catch (error) {
            if (error instanceof JobTrackerAPIError) {
                showErrorToast(error.message);
                setIsPending(false);
                return;
            }
            showErrorToast((error as Error).message);
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
                            onClick={() => setVisiblity(!visible)}
                        >
                            <Icon name={visible ? 'visibility' : 'visibilityOff'} />
                        </PrimaryButton>
                    </div>

                    {isPending ? (
                        <PrimaryButton variant='form' type='submit' disabled>
                            <LoadingSpinner size='sm' />
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
                    The free-tier server may take up to 50 seconds to wake up. Please wait after submitting.
                </div>
                <Link className={styles.userGuideLink} to={routes.userGuide} target='_blank'>
                    View user guide
                </Link>
            </div>
        </AuthLayout>
    );
};

export default SignIn;
