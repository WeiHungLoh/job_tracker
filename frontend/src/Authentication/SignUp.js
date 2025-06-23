import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Notification from '../Notification.js'
import { IoMdEyeOff } from 'react-icons/io'
import { IoEye } from 'react-icons/io5'
import { GoAlertFill } from 'react-icons/go'
import { MdEmail, MdLock } from 'react-icons/md'
import { FaBriefcase } from 'react-icons/fa'
import LoadingSpinner from '../Icons/LoadingSpinner.js'
import './SignUp.css'

const SignUp = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()
    const [notification, setNotification] = useState(null)
    const [visible, setVisiblity] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const handleSignUp = async (e) => {
        e.preventDefault()
        setIsPending(true)
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/signup`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                }
            )

            const message = await res.text()

            if (!res.ok) {
                alert('Failed to sign up: ' + message)
                setIsPending(false)
                return
            }

            setNotification({
                message: 'Sign up succesful! Redirecting you to login page',
                type: res.ok ? 'success' : 'error'
            })
            setTimeout(() => {
                setNotification(null)
                navigate('/')
            }, 1500)
            setIsPending(false)
        } catch (error) {
            alert('Failed to signed up. ' + error.message)
        }
    }

    const toggleSignIn = async () => {
        navigate('/')
    }

    const showVisiblity = () => {
        return visible ? <IoEye /> : <IoMdEyeOff />
    }

    return (
        <div className='signup'>
              <FaBriefcase className="logo-icon" />
            <h2>Sign up for Job Tracker</h2>
            <form onSubmit={handleSignUp}>

                <label>Email</label>
                <div className='input-box'>
                    <MdEmail className='left-icon' />
                    <input
                        type='email'
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>

                <label>Password</label>
                <div className='password-wrapper'>
                    <MdLock className="left-icon" />
                    <input
                        type={visible ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <div className='toggle-visibility' onClick={() => setVisiblity(!visible)}>
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

            <div className='notice-wrapper'>
                <span className='alert-icon'>
                    <GoAlertFill />
                </span>
                {'  '}If the sign-up process seems to hang after you click the sign up button,
                please wait up to 50 seconds. This may happen because the backend is hosted on a free tier,
                which can take time to wake up after periods of inactivity.
            </div>

            <Notification message={notification} />
        </div>
    )

}

export default SignUp
