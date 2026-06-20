import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Icon from '../../../components/icon/Icon'
import { JobTrackerAPIError } from '../../../api/models'
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner'
import PrimaryButton from '../../../components/button/PrimaryButton'
import { routes } from '../../../routes'
import styles from './SignIn.module.css'
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI'
import { useToast } from '../../../components/toast/ToastProvider'

const SignIn = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()
    const [visible, setVisiblity] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const api = useJobTrackerAPI()
    const { showErrorToast } = useToast()

    // Dummy fetch request to wake backend hosted on free tier
    useEffect(() => {
        void api.ping.wake()
    }, [api.ping])

    const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsPending(true)
        try {
            await api.authentication.signIn({ email, password })
            setIsPending(false)

            navigate(routes.addApplication)
        } catch (error) {
            if (error instanceof JobTrackerAPIError) {
                showErrorToast(error.message)
                setIsPending(false)
                return
            }
            showErrorToast((error as Error).message)
        }
    }

    const toggleSignUp = async () => {
        navigate(routes.signUp)
    }

    return (
        <div className={styles.signin}>
            <Icon name='briefcase' className={styles.logoIcon} />
            <h2>Sign in to Job Tracker</h2>
            <form onSubmit={handleSignIn}>

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
                    ? <PrimaryButton variant='form'><LoadingSpinner size={16} /> </PrimaryButton>
                    : <PrimaryButton variant='form' type='submit'>Sign in</PrimaryButton>
                }

                <p data-testid='signup' onClick={toggleSignUp}>
                    Don’t have an account? Create one
                </p>
            </form>
            <div className={styles.noticeWrapper}>
                <span>
                    <Icon name='alert' />
                </span>
                {'  '}If the sign-in process seems to hang after you click the sign in button,
                please wait at least 50 seconds. This may happen because the backend is hosted on a free tier,
                which can take time to wake up after periods of inactivity.
            </div>
            <Link className={styles.ugLink} to={routes.userGuide} target='_blank'>Click here to view user guide</Link>
        </div>
    )
}

export default SignIn
