import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { IoMdArchive } from 'react-icons/io'
import { IoNewspaperOutline } from 'react-icons/io5'
import { useState } from 'react'

const Navbar = () => {
    const location = useLocation()
    const currLocation = location.pathname
    const navigate = useNavigate()
    const [archived, setArchived] = useState(false)

    const showArchivedMessage = (archived) => {
        return archived ? 'Show Active' : 'Show Archived'
    }

    const showArchivedIcon = (archived) => {
        return archived ? <IoMdArchive /> : <IoNewspaperOutline />
    }

    const isAddApplicationActive = (currentLocation) => {
        if (currentLocation === '/addapplication') {
            return true
        }
        return false
    }

    const isViewApplicationsActive = (currentLocation) => {
        if (currentLocation === '/viewapplications') {
            return true
        }
        return false
    }

    const handleSignOut = async () => {
        await fetch(`${process.env.REACT_APP_API_URL}/auth/logout`, {
            method: 'GET',
            credentials: 'include',
        })
        navigate('/')
    }

    const isViewInterviewsActive = (currentLocation) => {
        if (currentLocation === '/viewinterviews') {
            return true
        }
        return false
    }

    const isViewArchivedApplicationsActive = (currentLocation) => {
        if (currentLocation === '/viewarchivedapplications') {
            return true
        }
        return false
    }
    const isViewArchivedInterviewsActive = (currentLocation) => {
        if (currentLocation === '/viewarchivedinterviews') {
            return true
        }
        return false
    }

    return (
        <nav className='navbar'>
            <h1>Job Tracker</h1>
            <div className='links'>
                {!archived &&
                    <>
                        <NavLink to='/addapplication' className={isAddApplicationActive(currLocation) ? 'active' : 'inactive'}>
                            Add Job Application
                        </NavLink>

                        <NavLink to='/viewapplications' className={isViewApplicationsActive(currLocation) ? 'active' : 'inactive'}>
                            View Job Applications
                        </NavLink>

                        <NavLink to='/viewinterviews' className={isViewInterviewsActive(currLocation) ? 'active' : 'inactive'}>
                            View Interviews
                        </NavLink>
                    </>
                }

                {archived &&
                    <>
                    <NavLink to='/viewarchivedapplications' className={isViewArchivedApplicationsActive(currLocation) ? 'active' : 'inactive'}>
                            View Archived Applications
                    </NavLink>
                    <NavLink to='/viewarchivedinterviews' className={isViewArchivedInterviewsActive(currLocation) ? 'active' : 'inactive'}>
                            View Archived Interviews
                    </NavLink>
                    </>
                }

                <NavLink to='/' className='inactive' onClick={handleSignOut} >Logout</NavLink>

                <div className='archive-status' onClick={() => setArchived(!archived)}>
                    <span>{showArchivedIcon(archived)} {' '}</span>
                    <span>{showArchivedMessage(archived)}</span>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
