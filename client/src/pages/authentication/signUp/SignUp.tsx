import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../../components/authLayout/AuthLayout';
import Icon from '../../../components/icon/Icon';
import { JobTrackerAPIError } from '../../../api/models';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import type { SubmitEvent } from 'react';
import { routes } from '../../../routes';
import styles from '../Authentication.module.css';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useState } from 'react';
import { useToast } from '../../../components/toast/ToastProvider';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [visible, setVisiblity] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const api = useJobTrackerAPI();
    const { showErrorToast, showSuccessToast } = useToast();

    const handleSignUp = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        try {
            await api.authentication.signUp({ email, password });

            showSuccessToast('Sign up succesful! Redirecting you to login page');
            setTimeout(() => {
                navigate(routes.signIn);
            }, 1500);
            setIsPending(false);
        } catch (error) {
            if (error instanceof JobTrackerAPIError) {
                showErrorToast('Failed to sign up: ' + error.message);
                setIsPending(false);
                return;
            }
            showErrorToast('Failed to signed up. ' + (error as Error).message);
        }
    };

    return (
        <AuthLayout>
            <div className={styles.card}>
                <Icon name='briefcase' className={styles.logoIcon} />
                <h2 className={styles.title}>Sign up for Job Tracker</h2>
                <form onSubmit={handleSignUp}>
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
                            autoComplete='new-password'
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
                            Sign up
                        </PrimaryButton>
                    )}

                    <Link className={styles.authLink} to={routes.signIn}>
                        Already have an account? Login here
                    </Link>
                </form>

                <div className={styles.noticeWrapper}>
                    <span className={styles.noticeIcon}>
                        <Icon name='alert' />
                    </span>
                    The free-tier server may take up to 50 seconds to wake up. Please wait after submitting.
                </div>
            </div>
        </AuthLayout>
    );
};

export default SignUp;
