import { useEffect, useState } from 'react';
import Icon from '../../components/icon/Icon';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useToast } from '../../components/toast/ToastProvider';
import styles from './DashboardStats.module.css';

type Stats = {
    total: number;
    activeInterviews: number;
    offers: number;
    responseRate: string;
    thisWeek: number;
};

const DashboardStats = () => {
    const api = useJobTrackerAPI();
    const [stats, setStats] = useState<Stats | null>(null);
    const { showErrorToast } = useToast();

    useEffect(() => {
        let isActive = true;

        const fetchStats = async () => {
            try {
                const [statusCounts, interviews, weekly] = await Promise.all([
                    api.application.listJobStatusCounts(),
                    api.interview.listInterviews(),
                    api.application.listWeeklyApplications(),
                ]);

                if (!isActive) return;

                const counts = Array.isArray(statusCounts) ? statusCounts : [];
                const interviewList = Array.isArray(interviews) ? interviews : [];
                const weeklyList = Array.isArray(weekly) ? weekly : [];

                const total = counts.reduce((sum, row) => sum + Number(row.count), 0);

                const offerCount = counts.find((row) => row.job_status === 'Offer');
                const offers = offerCount ? Number(offerCount.count) : 0;

                const respondedStatuses = ['Interview', 'Offer', 'Accepted', 'Rejected', 'Declined'];
                const responded = counts
                    .filter((row) => respondedStatuses.includes(row.job_status))
                    .reduce((sum, row) => sum + Number(row.count), 0);
                const responseRate = total > 0 ? `${Math.round((responded / total) * 100)}%` : '—';

                const thisWeek = weeklyList.length > 0 ? Number(weeklyList[weeklyList.length - 1].applications_count) : 0;

                const now = new Date();
                const activeInterviews = interviewList.filter(
                    (i) => new Date(i.interview_date) > now
                ).length;

                setStats({
                    total,
                    activeInterviews,
                    offers,
                    responseRate,
                    thisWeek,
                });
            } catch (error) {
                showErrorToast((error as Error).message);
            }
        };

        void fetchStats();
        return () => {
            isActive = false;
        };
    }, []);

    if (!stats) {
        return (
            <div className={styles.loading}>
                <LoadingSpinner size='sm' />
            </div>
        );
    }

    const cards = [
        { icon: 'briefcase' as const, label: 'Total Applications', value: stats.total },
        { icon: 'briefcase' as const, label: 'Applied this Week', value: stats.thisWeek },
        { icon: 'interview' as const, label: 'Upcoming Interviews', value: stats.activeInterviews },
        { icon: 'success' as const, label: 'Offers Received', value: stats.offers },
        { icon: 'highlight' as const, label: 'Response Rate', value: stats.responseRate }
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
