import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { type MouseEvent, useEffect, useState } from 'react';
import Icon from '../../../../components/icon/Icon';
import PrimaryButton from '../../../../components/button/PrimaryButton';
import { routes } from '../../../../routes';
import styles from './DemoNavbar.module.css';
import { useTheme } from '../../../../components/theme/ThemeContext';

const ARCHIVED_LOCATIONS: readonly string[] = [routes.demoArchivedApplications, routes.demoArchivedInterviews];

const ACTIVE_NAV_LINKS = [
    { to: routes.demoDashboard, label: 'Dashboard' },
    { to: routes.demoAddApplication, label: 'Add Job Application' },
    { to: routes.demoViewApplications, label: 'View Job Applications' },
    { to: routes.demoViewInterviews, label: 'View Interviews' },
] as const;

const ARCHIVED_NAV_LINKS = [
    { to: routes.demoArchivedApplications, label: 'View Archived Applications' },
    { to: routes.demoArchivedInterviews, label: 'View Archived Interviews' },
] as const;

const DemoNavbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const currentLocation = location.pathname;
    const [archived, setArchived] = useState<boolean>(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        setArchived(ARCHIVED_LOCATIONS.includes(currentLocation));
    }, [currentLocation]);

    const handleExitDemo = (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        navigate(routes.signIn, { state: { fromLogout: true } });
    };

    const navLinks = archived ? ARCHIVED_NAV_LINKS : ACTIVE_NAV_LINKS;

    return (
        <nav className={styles.navbar}>
            <h1>Demo</h1>
            <div className={styles.links}>
                {navLinks.map(({ to, label }) => (
                    <NavLink key={to} to={to} className={currentLocation === to ? styles.active : styles.inactive}>
                        {label}
                    </NavLink>
                ))}
                <PrimaryButton
                    variant='navigation'
                    type='button'
                    className={styles.archiveStatus}
                    onClick={() => setArchived((isArchived) => !isArchived)}
                >
                    <Icon name={archived ? 'archive' : 'activeApplications'} />
                    <span>{archived ? 'Show Active' : 'Show Archived'}</span>
                </PrimaryButton>

                <PrimaryButton variant='navigation' type='button' className={styles.inactive} onClick={toggleTheme}>
                    <Icon name={theme === 'dark' ? 'lightMode' : 'darkMode'} />
                </PrimaryButton>

                <NavLink to={routes.signIn} className={styles.inactive} onClick={handleExitDemo}>
                    Exit Demo
                </NavLink>
            </div>
        </nav>
    );
};

export default DemoNavbar;
