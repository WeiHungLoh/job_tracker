import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { type MouseEvent, useEffect, useState } from 'react';
import Icon from '../icon/Icon';
import PrimaryButton from '../button/PrimaryButton';
import { routes } from '../../routes';
import styles from './Navbar.module.css';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useToast } from '../toast/ToastProvider';

const archivedLocations: readonly string[] = [routes.archivedApplications, routes.archivedInterviews];

const Navbar = () => {
    const location = useLocation();
    const currLocation = location.pathname;
    const navigate = useNavigate();
    const [archived, setArchived] = useState(false);
    const api = useJobTrackerAPI();
    const { showErrorToast } = useToast();

    useEffect(() => {
        setArchived(archivedLocations.includes(currLocation));
    }, [currLocation]);

    const handleSignOut = async (e: MouseEvent) => {
        e.preventDefault();
        try {
            await api.authentication.logout();
            navigate(routes.signIn, { state: { fromLogout: true } });
        } catch (error) {
            showErrorToast(error instanceof Error ? error.message : 'Unable to sign out.');
        }
    };

    return (
        <nav className={styles.navbar}>
            <h1>Job Tracker</h1>
            <div className={styles.links}>
                {!archived && (
                    <>
                        <NavLink
                            to={routes.dashboard}
                            className={currLocation === routes.dashboard ? styles.active : styles.inactive}
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to={routes.addApplication}
                            className={currLocation === routes.addApplication ? styles.active : styles.inactive}
                        >
                            Add Job Application
                        </NavLink>

                        <NavLink
                            to={routes.viewApplications}
                            className={currLocation === routes.viewApplications ? styles.active : styles.inactive}
                        >
                            View Job Applications
                        </NavLink>

                        <NavLink
                            to={routes.viewInterviews}
                            className={currLocation === routes.viewInterviews ? styles.active : styles.inactive}
                        >
                            View Interviews
                        </NavLink>
                    </>
                )}

                {archived && (
                    <>
                        <NavLink
                            to={routes.archivedApplications}
                            className={currLocation === routes.archivedApplications ? styles.active : styles.inactive}
                        >
                            View Archived Applications
                        </NavLink>
                        <NavLink
                            to={routes.archivedInterviews}
                            className={currLocation === routes.archivedInterviews ? styles.active : styles.inactive}
                        >
                            View Archived Interviews
                        </NavLink>
                    </>
                )}
                <PrimaryButton
                    variant='navigation'
                    type='button'
                    className={styles.archiveStatus}
                    onClick={() => setArchived(!archived)}
                >
                    <Icon name={archived ? 'archive' : 'activeApplications'} />
                    <span>{archived ? 'Show Active' : 'Show Archived'}</span>
                </PrimaryButton>

                <NavLink to={routes.signIn} className={styles.inactive} onClick={handleSignOut}>
                    Logout
                </NavLink>
            </div>
        </nav>
    );
};

export default Navbar;
