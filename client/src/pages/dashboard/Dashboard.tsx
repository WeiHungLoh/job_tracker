import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardContent from './DashboardContent';
import type { JobStatus, JobStatusCount, WeeklyApplicationCount } from '../application/models';
import type { JobInterview } from '../interview/models';
import type {
    DashboardApplicationNavigationState,
    DashboardInterviewNavigationState,
} from '../../helper/dashboardNavigation';
import { getErrorToastMessage } from '../../helper/getErrorToastMessage';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useToast } from '../../components/toast/ToastProvider';
import { routes } from '../../routes';

const Dashboard = () => {
    const [statusCounts, setStatusCounts] = useState<JobStatusCount[]>([]);
    const [interviews, setInterviews] = useState<JobInterview[]>([]);
    const [weeklyApplications, setWeeklyApplications] = useState<WeeklyApplicationCount[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const api = useJobTrackerAPI();
    const { showErrorToast } = useToast();
    const navigate = useNavigate();

    const handleStatusSelect = (status: JobStatus) => {
        const state: DashboardApplicationNavigationState = { dashboardJobStatus: status };
        navigate(routes.viewApplications, { state });
    };

    const handleInterviewSelect = (interviewId: number) => {
        const state: DashboardInterviewNavigationState = { dashboardInterviewId: interviewId };
        navigate(routes.viewInterviews, { state });
    };

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
        <DashboardContent
            statusCounts={statusCounts}
            interviews={interviews}
            weeklyApplications={weeklyApplications}
            isLoading={isLoading}
            onInterviewSelect={handleInterviewSelect}
            onStatusSelect={handleStatusSelect}
        />
    );
};

export default Dashboard;
