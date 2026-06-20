import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { IoMdArchive } from 'react-icons/io'
import { IoNewspaperOutline } from 'react-icons/io5'
import { routes } from '../../routes'
import styles from './Navbar.module.css'
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI'
import { useToast } from '../toast/ToastProvider'

const Navbar = () => {
    const location = useLocation()
    const currLocation = location.pathname
    const navigate = useNavigate()
    const [archived, setArchived] = useState(false)
    const api = useJobTrackerAPI()
    const { showErrorToast } = useToast()
    const archivedLocations: readonly string[] = [routes.archivedApplications, routes.archivedInterviews]

    useEffect(() => {
        if (archivedLocations.includes(currLocation)) {
            setArchived(true)
        } else {
            setArchived(false)
        }
    }, [location])

    const showArchivedMessage = (archived: boolean) => {
        return archived ? 'Show Active' : 'Show Archived'
    }

    const showArchivedIcon = (archived: boolean) => {
        return archived ? <IoMdArchive /> : <IoNewspaperOutline />
    }

    const isAddApplicationActive = (currentLocation: string) => {
        if (currentLocation === routes.addApplication) {
            return true
        }
        return false
    }

    const isDashBoardActive = (currentLocation: string) => {
        if (currentLocation === routes.dashboard) {
            return true
        }
        return false
    }

    const isViewApplicationsActive = (currentLocation: string) => {
        if (currentLocation === routes.viewApplications) {
            return true
        }
        return false
    }

    const handleSignOut = async () => {
        try {
            await api.authentication.logout()
            navigate(routes.signIn)
        } catch (error) {
            showErrorToast(error instanceof Error ? error.message : 'Unable to sign out.')
        }
    }

    const isViewInterviewsActive = (currentLocation: string) => {
        if (currentLocation === routes.viewInterviews) {
            return true
        }
        return false
    }

    const isViewArchivedApplicationsActive = (currentLocation: string) => {
        if (currentLocation === routes.archivedApplications) {
            return true
        }
        return false
    }
    const isViewArchivedInterviewsActive = (currentLocation: string) => {
        if (currentLocation === routes.archivedInterviews) {
            return true
        }
        return false
    }

    return (
        <nav className={styles.navbar}>
            <h1>Job Tracker</h1>
            <div className={styles.links}>
                {!archived &&
                    <>
                        <NavLink to={routes.dashboard} className={isDashBoardActive(currLocation) ? styles.active : styles.inactive} >
                            Dashboard
                        </NavLink>
                        <NavLink to={routes.addApplication} className={isAddApplicationActive(currLocation) ? styles.active : styles.inactive}>
                            Add Job Application
                        </NavLink>

                        <NavLink to={routes.viewApplications} className={isViewApplicationsActive(currLocation) ? styles.active : styles.inactive}>
                            View Job Applications
                        </NavLink>

                        <NavLink to={routes.viewInterviews} className={isViewInterviewsActive(currLocation) ? styles.active : styles.inactive}>
                            View Interviews
                        </NavLink>
                    </>
                }

                {archived &&
                    <>
                        <NavLink to={routes.archivedApplications} className={isViewArchivedApplicationsActive(currLocation) ? styles.active : styles.inactive}>
                            View Archived Applications
                        </NavLink>
                        <NavLink to={routes.archivedInterviews} className={isViewArchivedInterviewsActive(currLocation) ? styles.active : styles.inactive}>
                            View Archived Interviews
                        </NavLink>
                    </>
                }
                <div role='set-archived' className={styles.archiveStatus} onClick={() => setArchived(!archived)}>
                    <span>{showArchivedIcon(archived)} {' '}</span>
                    <span>{showArchivedMessage(archived)}</span>
                </div>

                <NavLink to={routes.signIn} className={styles.inactive} onClick={handleSignOut} >Logout</NavLink>

            </div>
        </nav>
    )
}

export default Navbar
