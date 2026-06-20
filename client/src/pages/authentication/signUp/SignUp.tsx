import { MdEmail, MdLock } from 'react-icons/md'
import { FaBriefcase } from 'react-icons/fa'
import type { FormEvent } from 'react'
import { GoAlertFill } from 'react-icons/go'
import { IoEye } from 'react-icons/io5'
import { IoMdEyeOff } from 'react-icons/io'
import { JobTrackerAPIError } from '../../../api/models'
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner'
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

    const showVisiblity = () => {
        return visible ? <IoEye /> : <IoMdEyeOff />
    }

    return (
        <div className={styles.signup}>
              <FaBriefcase className={styles.logoIcon} />
            <h2>Sign up for Job Tracker</h2>
            <form onSubmit={handleSignUp}>

                <label htmlFor='email'>Email</label>
                <div className={styles.inputBox}>
                    <MdEmail className={styles.leftIcon} />
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
                    <MdLock className={styles.leftIcon} />
                    <input
                        id='password'
                        type={visible ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <div className={styles.toggleVisibility} onClick={() => setVisiblity(!visible)}>
                        {showVisiblity()}
                    </div>
                </div>

                {isPending
                    ? <button>Loading...{' '}<LoadingSpinner /> </button>
                    : <button type='submit'>Sign up</button>
                }

                <p onClick={toggleSignIn}>
                    Already have an account? Login here
                </p>
            </form>

            <div className={styles.noticeWrapper}>
                <span>
                    <GoAlertFill />
                </span>
                {'  '}If the sign-up process seems to hang after you click the sign up button,
                please wait at least 50 seconds. This may happen because the backend is hosted on a free tier,
                which can take time to wake up after periods of inactivity.
            </div>

        </div>
    )

}

export default SignUp
