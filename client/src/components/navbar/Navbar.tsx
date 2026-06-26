import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { type MouseEvent, useEffect, useState } from 'react';
import Icon from '../icon/Icon';
import PrimaryButton from '../button/PrimaryButton';
import { routes } from '../../routes';
import styles from './Navbar.module.css';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useTheme } from '../theme/ThemeContext';
import { useToast } from '../toast/ToastProvider';

const archivedLocations: readonly string[] = [routes.archivedApplications, routes.archivedInterviews];

const ACTIVE_NAV_LINKS = [
    { to: routes.dashboard, label: 'Dashboard' },
    { to: routes.addApplication, label: 'Add Job Application' },
    { to: routes.viewApplications, label: 'View Job Applications' },
    { to: routes.viewInterviews, label: 'View Interviews' },
] as const;

const ARCHIVED_NAV_LINKS = [
    { to: routes.archivedApplications, label: 'View Archived Applications' },
    { to: routes.archivedInterviews, label: 'View Archived Interviews' },
] as const;

const Navbar = () => {
    const location = useLocation();
    const currLocation = location.pathname;
    const navigate = useNavigate();
    const [archived, setArchived] = useState(false);
    const api = useJobTrackerAPI();
    const { showErrorToast } = useToast();
    const { theme, toggleTheme } = useTheme();

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

    const navLinks = archived ? ARCHIVED_NAV_LINKS : ACTIVE_NAV_LINKS;

    return (
        <nav className={styles.navbar}>
            <h1>Job Tracker</h1>
            <div className={styles.links}>
                {navLinks.map(({ to, label }) => (
                    <NavLink key={to} to={to} className={currLocation === to ? styles.active : styles.inactive}>
                        {label}
                    </NavLink>
                ))}
                <PrimaryButton
                    variant='navigation'
                    type='button'
                    className={styles.archiveStatus}
                    onClick={() => setArchived(!archived)}
                >
                    <Icon name={archived ? 'archive' : 'activeApplications'} />
                    <span>{archived ? 'Show Active' : 'Show Archived'}</span>
                </PrimaryButton>

                <PrimaryButton
                    variant='navigation'
                    type='button'
                    className={styles.inactive}
                    onClick={toggleTheme}
                >
                    <Icon name={theme === 'dark' ? 'lightMode' : 'darkMode'} />
                </PrimaryButton>

                <NavLink to={routes.signIn} className={styles.inactive} onClick={handleSignOut}>
                    Logout
                </NavLink>
            </div>
        </nav>
    );
};

export default Navbar;
