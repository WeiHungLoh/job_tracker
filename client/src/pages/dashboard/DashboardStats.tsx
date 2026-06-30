import Icon from '../../components/icon/Icon';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import styles from './DashboardStats.module.css';
import type { DashboardStatsProps } from './models';
import type { JobStatus } from '../application/models';

const RESPONDED_STATUSES = new Set<JobStatus>(['Interview', 'Offer', 'Accepted', 'Rejected', 'Declined']);

const DashboardStats = ({ statusCounts, interviews, weeklyApplications, isLoading }: DashboardStatsProps) => {
    if (isLoading) {
        return (
            <div className={styles.loading}>
                <LoadingSpinner size='sm' />
            </div>
        );
    }

    const total = statusCounts.reduce((sum, row) => sum + Number(row.count), 0);
    const offerCount = statusCounts.find((row) => row.job_status === 'Offer');
    const offers = offerCount ? Number(offerCount.count) : 0;
    const responded = statusCounts
        .filter((row) => RESPONDED_STATUSES.has(row.job_status))
        .reduce((sum, row) => sum + Number(row.count), 0);
    const responseRate = total > 0 ? `${Math.round((responded / total) * 100)}%` : '—';
    const applicationsThisWeek =
        weeklyApplications.length > 0
            ? Number(weeklyApplications[weeklyApplications.length - 1].applications_count)
            : 0;
    const now = new Date();
    const upcomingInterviews = interviews.filter((interview) => new Date(interview.interview_date) > now).length;

    const cards = [
        { icon: 'briefcase' as const, label: 'Total Applications', value: total },
        { icon: 'briefcase' as const, label: 'Applied this Week', value: applicationsThisWeek },
        { icon: 'interview' as const, label: 'Upcoming Interviews', value: upcomingInterviews },
        { icon: 'success' as const, label: 'Offers Received', value: offers },
        { icon: 'highlight' as const, label: 'Response Rate', value: responseRate },
    ];

    return (
        <div className={styles.statsRow}>
            {cards.map((card) => (
                <div className={styles.card} key={card.label}>
                    <div className={styles.icon}>
                        <Icon name={card.icon} size={24} />
                    </div>
                    <div className={styles.value}>{card.value}</div>
                    <div className={styles.label}>{card.label}</div>
                </div>
            ))}
        </div>
    );
};

export default DashboardStats;
