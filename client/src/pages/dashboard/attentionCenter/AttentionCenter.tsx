import { useMemo } from 'react';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import type { JobApplication } from '../../application/models';
import type { JobInterview } from '../../interview/models';
import ApplicationStatusBadge from '../../application/ApplicationStatusBadge';
import DashboardCard from '../shared/dashboardCard/DashboardCard';
import { getAttentionItems } from './attentionCenterData';
import styles from './AttentionCenter.module.css';

type AttentionCenterProps = {
    applications: readonly JobApplication[];
    interviews: readonly JobInterview[];
    isLoading: boolean;
    currentTime?: Date;
};

const AttentionCenter = ({ applications, interviews, isLoading, currentTime = new Date() }: AttentionCenterProps) => {
    const items = useMemo(
        () => getAttentionItems(applications, interviews, currentTime),
        [applications, currentTime, interviews]
    );

    return (
        <DashboardCard
            className={styles.attentionCard}
            title='Needs Attention'
            description='Your highest-priority follow-ups, ordered by urgency.'
        >
            {isLoading ? (
                <div className={styles.centered}>
                    <LoadingSpinner size='sm' />
                </div>
            ) : items.length === 0 ? (
                <div className={styles.centered}>
                    <div>
                        <h3>You&apos;re all caught up</h3>
                        <p>No applications need attention right now.</p>
                    </div>
                </div>
            ) : (
                <ul className={styles.attentionList} aria-label='Applications needing attention'>
                    {items.map(({ application, category, message }) => (
                        <li
                            className={`${styles.attentionItem} ${styles[application.job_status.toLowerCase()]}`}
                            data-category={category}
                            key={application.job_id}
                        >
                            <div className={styles.itemHeading}>
                                <div className={styles.applicationDetails}>
                                    <h3>{application.company_name}</h3>
                                    <p>{application.job_title}</p>
                                </div>
                                <ApplicationStatusBadge compact jobStatus={application.job_status} />
                            </div>
                            <p className={styles.reason}>{message}</p>
                        </li>
                    ))}
                </ul>
            )}
        </DashboardCard>
    );
};

export default AttentionCenter;
