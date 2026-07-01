import type { ReactNode } from 'react';
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

const AuthProductIntro = ({ children }: AuthProductIntroProps) => {
    return (
        <div className={styles.authContainer}>
            <section className={styles.productCopy} aria-labelledby='auth-product-heading'>
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
            </section>

            <div className={styles.authCardSlot}>{children}</div>

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
        </div>
    );
};

export default AuthProductIntro;
