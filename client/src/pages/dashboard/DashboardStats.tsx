import Icon from '../../components/icon/Icon';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import styles from './DashboardStats.module.css';
import type { DashboardStatsProps } from './models';
import type { JobStatus } from '../application/models';
import { getStatusCountMap, getTotalStatusCount, getUpcomingInterviews } from './dashboardData';

const INTERVIEW_PLUS_STATUSES: readonly JobStatus[] = ['Interview', 'Offer', 'Accepted', 'Declined'];
const OFFER_PLUS_STATUSES: readonly JobStatus[] = ['Offer', 'Accepted', 'Declined'];

const DashboardStats = ({ statusCounts, interviews, weeklyApplications, isLoading }: DashboardStatsProps) => {
    if (isLoading) {
        return (
            <div className={styles.loading}>
                <LoadingSpinner size='sm' />
            </div>
        );
    }

    const countByStatus = getStatusCountMap(statusCounts);
    const total = getTotalStatusCount(countByStatus);
    const interviewPlus = INTERVIEW_PLUS_STATUSES.reduce((sum, status) => sum + (countByStatus[status] ?? 0), 0);
    const offerPlus = OFFER_PLUS_STATUSES.reduce((sum, status) => sum + (countByStatus[status] ?? 0), 0);
    const interviewRate = total > 0 ? `${Math.round((interviewPlus / total) * 100)}%` : '—';
    const offerRate = total > 0 ? `${Math.round((offerPlus / total) * 100)}%` : '—';
    const latestApplicationCount = Number(weeklyApplications[weeklyApplications.length - 1]?.applications_count ?? 0);
    const applicationsThisWeek = Number.isFinite(latestApplicationCount) ? latestApplicationCount : 0;
    const upcomingInterviews = getUpcomingInterviews(interviews).length;

    const cards = [
        { icon: 'briefcase' as const, label: 'Total Applications', value: total },
        { icon: 'activeApplications' as const, label: 'Applied This Week', value: applicationsThisWeek },
        { icon: 'interview' as const, label: 'Upcoming Interviews', value: upcomingInterviews },
        { icon: 'highlight' as const, label: 'Interview Rate', value: interviewRate },
        { icon: 'success' as const, label: 'Offer Rate', value: offerRate },
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
