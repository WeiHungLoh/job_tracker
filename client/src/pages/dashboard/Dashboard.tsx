import { useEffect, useState } from 'react';
import ApplicationsLineChart from './ApplicationsLineChart';
import DashboardStats from './DashboardStats';
import JobStatusChart from './JobStatusChart';
import type { JobInterview } from '../interview/models';
import type { JobStatusCount, WeeklyApplicationCount } from './models';
import { getErrorToastMessage } from '../../helper/getErrorToastMessage';
import styles from './Dashboard.module.css';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useToast } from '../../components/toast/ToastProvider';

const Dashboard = () => {
    const [statusCounts, setStatusCounts] = useState<JobStatusCount[]>([]);
    const [interviews, setInterviews] = useState<JobInterview[]>([]);
    const [weeklyApplications, setWeeklyApplications] = useState<WeeklyApplicationCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const api = useJobTrackerAPI();
    const { showErrorToast } = useToast();

    useEffect(() => {
        let isActive = true;

        const fetchDashboardData = async () => {
            try {
                const [jobStatusCounts, jobInterviews, weeklyApplicationCounts] = await Promise.all([
                    api.application.listJobStatusCounts(),
                    api.interview.listInterviews(),
                    api.application.listWeeklyApplications(),
                ]);

                if (!isActive) {
                    return;
                }

                setStatusCounts(Array.isArray(jobStatusCounts) ? jobStatusCounts : []);
                setInterviews(Array.isArray(jobInterviews) ? jobInterviews : []);
                setWeeklyApplications(Array.isArray(weeklyApplicationCounts) ? weeklyApplicationCounts : []);
            } catch (error) {
                showErrorToast(getErrorToastMessage(error, 'Unable to load dashboard data. Please try again.'));
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        void fetchDashboardData();

        return () => {
            isActive = false;
        };
    }, []);

    return (
        <div className={styles.dashboard}>
            <DashboardStats
                statusCounts={statusCounts}
                interviews={interviews}
                weeklyApplications={weeklyApplications}
                isLoading={isLoading}
            />
            <ApplicationsLineChart weeklyApplications={weeklyApplications} isLoading={isLoading} />
            <JobStatusChart statusCounts={statusCounts} isLoading={isLoading} />
        </div>
    );
};

export default Dashboard;
