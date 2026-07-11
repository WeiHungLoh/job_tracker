import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Icon from '../icon/Icon';
import PrimaryButton from '../button/PrimaryButton';
import { routes } from '../../routes';
import styles from './Navbar.module.css';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useTheme } from '../theme/ThemeContext';
import { useToast } from '../toast/ToastProvider';
import { getErrorToastMessage } from '../../helper/getErrorToastMessage';

const ARCHIVED_LOCATIONS: readonly string[] = [routes.archivedApplications, routes.archivedInterviews];

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
    const currentLocation = location.pathname;
    const navigate = useNavigate();
    const [archived, setArchived] = useState<boolean>(() => ARCHIVED_LOCATIONS.includes(currentLocation));
    const activeLinkRef = useRef<HTMLAnchorElement>(null);
    const api = useJobTrackerAPI();
    const { showErrorToast } = useToast();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        setArchived(ARCHIVED_LOCATIONS.includes(currentLocation));
    }, [currentLocation]);

    useEffect(() => {
        activeLinkRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }, [archived, currentLocation]);

    const handleSignOut = async () => {
        try {
            await api.authentication.logout();
            navigate(routes.signIn, { state: { fromLogout: true } });
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to sign out. Please try again.'));
        }
    };

    const navLinks = archived ? ARCHIVED_NAV_LINKS : ACTIVE_NAV_LINKS;

    return (
        <nav aria-label='Primary navigation' className={styles.navbar}>
            <div className={styles.navbarContent}>
                <div className={styles.brand}>
                    <span className={styles.brandIcon}>
                        <Icon name='briefcase' size={17} />
                    </span>
                    <h1>Job Tracker</h1>
                </div>

                <div aria-label={archived ? 'Archived pages' : 'Active pages'} className={styles.primaryLinks}>
                    {navLinks.map(({ to, label }) => (
                        <NavLink
                            className={currentLocation === to ? styles.active : styles.inactive}
                            key={to}
                            ref={currentLocation === to ? activeLinkRef : undefined}
                            to={to}
                        >
                            {label}
                        </NavLink>
                    ))}
                </div>

                <div className={styles.utilityActions}>
                    <PrimaryButton
                        aria-label={archived ? 'Show Active' : 'Show Archived'}
                        className={styles.archiveStatus}
                        onClick={() => setArchived((isArchived) => !isArchived)}
                        type='button'
                        variant='navigation'
                    >
                        <Icon name={archived ? 'archive' : 'activeApplications'} size={18} />
                        <span className={styles.utilityLabel}>{archived ? 'Show Active' : 'Show Archived'}</span>
                    </PrimaryButton>

                    <PrimaryButton
                        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        className={styles.iconAction}
                        onClick={toggleTheme}
                        type='button'
                        variant='navigation'
                    >
                        <Icon name={theme === 'dark' ? 'lightMode' : 'darkMode'} size={20} />
                    </PrimaryButton>

                    <PrimaryButton
                        className={styles.utilityAction}
                        onClick={() => void handleSignOut()}
                        type='button'
                        variant='navigation'
                    >
                        Logout
                    </PrimaryButton>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
