import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LoadingSpinner from './Icons/LoadingSpinner.js'

const ProtectedRoutes = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    const checkIsAuth = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/check`, {
                credentials: 'include',
            })

            if (res.ok) {
                setIsAuthenticated(true)
            } else {
                setIsAuthenticated(false)
            }
        } catch (error) {
            setIsAuthenticated(false)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        checkIsAuth()
    }, [])

    // Loading state is needed to allow time to confirm if user is logged in
    if (loading) {
        return <div>Loading... <LoadingSpinner /></div>
    }

    return isAuthenticated ? <Outlet /> : <Navigate to='/' />
}

export default ProtectedRoutes
