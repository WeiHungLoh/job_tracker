import { useState } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import applicationPreview from '../../../images/view-application.png';
import { routes } from '../../routes';
import Icon from '../icon/Icon';
import styles from './AuthProductIntro.module.css';

const productBenefits = [
    {
        icon: 'activeApplications',
        text: 'Track every application and its current status',
    },
    {
        icon: 'interview',
        text: 'Keep interviews connected to the right application',
    },
    {
        icon: 'dashboard',
        text: 'View your job-search progress from one dashboard',
    },
] as const;

type AuthProductIntroProps = {
    children: ReactNode;
};

export const AUTH_FOCUSED_MODE_STORAGE_KEY = 'jobTrackerAuthFocusedMode';

const getInitialFocusedMode = (): boolean => {
    try {
        return localStorage.getItem(AUTH_FOCUSED_MODE_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

const AuthProductIntro = ({ children }: AuthProductIntroProps) => {
    const [isFocusedMode, setIsFocusedMode] = useState<boolean>(getInitialFocusedMode);
    const containerClassName = `${styles.authContainer} ${isFocusedMode ? styles.focusedMode : ''}`;

    const enableFocusedMode = () => {
        if (isFocusedMode) {
            return;
        }

        setIsFocusedMode(true);

        try {
            localStorage.setItem(AUTH_FOCUSED_MODE_STORAGE_KEY, 'true');
        } catch {
            // Focused mode still works when storage is unavailable.
        }
    };

    const showProductOverview = () => {
        setIsFocusedMode(false);

        try {
            localStorage.removeItem(AUTH_FOCUSED_MODE_STORAGE_KEY);
        } catch {
            // Product overview still works when storage is unavailable.
        }
    };

    const handleAuthInteraction = (event: SyntheticEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' || (target.id !== 'email' && target.id !== 'password')) {
            return;
        }

        enableFocusedMode();
    };

    return (
        <div className={containerClassName} data-auth-focused={isFocusedMode ? 'true' : undefined}>
            <section
                className={styles.productPanel}
                aria-hidden={isFocusedMode}
                aria-labelledby='auth-product-heading'
                inert={isFocusedMode ? true : undefined}
            >
                <div className={styles.productCopy}>
                    <h1 id='auth-product-heading'>Organise your job search in one place</h1>
                    <p className={styles.description}>
                        Track applications, manage interviews and monitor your progress without relying on scattered
                        spreadsheets or notes.
                    </p>
                    <ul className={styles.benefitList}>
                        {productBenefits.map((benefit) => (
                            <li key={benefit.text}>
                                <span className={styles.benefitIcon}>
                                    <Icon name={benefit.icon} />
                                </span>
                                <span>{benefit.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <Link className={styles.guideLink} to={routes.userGuide} target='_blank'>
                    See how it works
                    <span aria-hidden='true'>→</span>
                </Link>

                <div className={styles.preview} aria-label='Job Tracker product preview'>
                    <div className={styles.browserBar} aria-hidden='true'>
                        <span />
                        <span />
                        <span />
                        <div className={styles.browserAddress}>jobtracker.weihungloh.com</div>
                    </div>
                    <img
                        src={applicationPreview}
                        alt='Job Tracker application list showing applications, statuses, interviews and notes'
                    />
                </div>
            </section>

            <section className={styles.authPanel} aria-label='Account access'>
                <div
                    className={styles.restoreControl}
                    aria-hidden={!isFocusedMode}
                    inert={!isFocusedMode ? true : undefined}
                >
                    <button type='button' className={styles.restoreOverviewButton} onClick={showProductOverview}>
                        <span className={styles.restoreIcon} aria-hidden='true'>
                            <Icon name='arrowBack' />
                        </span>
                        <span>Why use Job Tracker?</span>
                    </button>
                </div>

                <div
                    className={styles.authCardSlot}
                    onFocusCapture={handleAuthInteraction}
                >
                    {children}
                </div>
            </section>
        </div>
    );
};

export default AuthProductIntro;
