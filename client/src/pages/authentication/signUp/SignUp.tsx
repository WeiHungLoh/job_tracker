import type { FormEvent } from 'react'
import Icon from '../../../components/icon/Icon'
import { JobTrackerAPIError } from '../../../api/models'
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner'
import PrimaryButton from '../../../components/button/PrimaryButton'
import { routes } from '../../../routes'
import styles from './SignUp.module.css'
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useToast } from '../../../components/toast/ToastProvider'

const SignUp = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()
    const [visible, setVisiblity] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const api = useJobTrackerAPI()
    const { showErrorToast, showSuccessToast } = useToast()

    const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsPending(true)
        try {
            await api.authentication.signUp({ email, password })

            showSuccessToast('Sign up succesful! Redirecting you to login page')
            setTimeout(() => {
                navigate(routes.signIn)
            }, 1500)
            setIsPending(false)
        } catch (error) {
            if (error instanceof JobTrackerAPIError) {
                showErrorToast('Failed to sign up: ' + error.message)
                setIsPending(false)
                return
            }
            showErrorToast('Failed to signed up. ' + (error as Error).message)
        }
    }

    const toggleSignIn = async () => {
        navigate(routes.signIn)
    }

    return (
        <div className={styles.signup}>
            <Icon name='briefcase' className={styles.logoIcon} />
            <h2>Sign up for Job Tracker</h2>
            <form onSubmit={handleSignUp}>

                <label htmlFor='email'>Email</label>
                <div className={styles.inputBox}>
                    <Icon name='email' className={styles.leftIcon} />
                    <input
                        id='email'
                        type='email'
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>

                <label htmlFor='password'>Password</label>
                <div className={styles.passwordWrapper}>
                    <Icon name='lock' className={styles.leftIcon} />
                    <input
                        id='password'
                        type={visible ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <div className={styles.toggleVisibility} onClick={() => setVisiblity(!visible)}>
                        <Icon name={visible ? 'visibility' : 'visibilityOff'} />
                    </div>
                </div>

                {isPending
                    ? <PrimaryButton variant='form'><LoadingSpinner size='sm' /> </PrimaryButton>
                    : <PrimaryButton variant='form' type='submit'>Sign up</PrimaryButton>
                }

                <p onClick={toggleSignIn}>
                    Already have an account? Login here
                </p>
            </form>

            <div className={styles.noticeWrapper}>
                <span>
                    <Icon name='alert' />
                </span>
                {'  '}If the sign-up process seems to hang after you click the sign up button,
                please wait at least 50 seconds. This may happen because the backend is hosted on a free tier,
                which can take time to wake up after periods of inactivity.
            </div>

        </div>
    )

}

export default SignUp
