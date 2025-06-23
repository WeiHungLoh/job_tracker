import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { IoMdEyeOff } from 'react-icons/io'
import { IoEye } from 'react-icons/io5'
import { GoAlertFill } from 'react-icons/go'
import LoadingSpinner from '../Icons/LoadingSpinner.js'
import './SignIn.css'

const SignIn = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()
    const [visible, setVisiblity] = useState(false)
    const [isPending, setIsPending] = useState(false)

    // Dummy fetch request to wake backend hosted on free tier
    fetch(`${process.env.REACT_APP_API_URL}/ping/ping`)

    const handleSignIn = async (e) => {
        e.preventDefault()
        setIsPending(true)
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/signin`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                }
            )

            const data = await res.json()
            if (!res.ok) {
                alert('Failed to sign in: ' + data.message)
                setIsPending(false)
                return
            }
            setIsPending(false)

            // Save access token so we can use it for routes protected by access token
            localStorage.setItem('token', data.token)
            navigate('/addapplication')
        } catch (error) {
            alert('Failed to sign in! ' + error.message)
        }
    }

    const toggleSignUp = async () => {
        navigate('/signup')
    }

    const showVisiblity = () => {
        return visible ? <IoEye /> : <IoMdEyeOff />
    }

    return (
        <div className='signin'>
            <h2>Sign in to Job Tracker</h2>
            <form onSubmit={handleSignIn}>

                <label>Email</label>
                <input
                    type='email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />

                <label>Password</label>
                <div className='password-wrapper'>
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
                    ?   <button>Loading...{' '}<LoadingSpinner /> </button>
                    :   <button type='submit'>Sign in</button>
                }

                <p onClick={toggleSignUp}>
                    Don’t have an account? Create one
                </p>
            </form>
            <div className='notice-wrapper'>
                <span className='alert-icon'>
                    <GoAlertFill />
                </span>
                {'  '}If the sign-in process seems to hang after you click the sign in button,
                please wait up to 30 seconds. This may happen because the backend is hosted on a free tier,
                which can take time to wake up after periods of inactivity.
            </div>
            <Link className='ug-link' to='/userguide' target='_blank'>Click here to view user guide</Link>
        </div>
    )
}

export default SignIn
