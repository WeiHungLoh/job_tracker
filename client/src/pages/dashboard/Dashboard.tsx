import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardContent from './DashboardContent';
import type { JobApplication, JobStatus, JobStatusCount, WeeklyApplicationCount } from '../application/models';
import type { JobInterview } from '../interview/models';
import type {
    DashboardApplicationNavigationState,
    DashboardInterviewNavigationState,
} from '../../helper/dashboardNavigation';
import { getErrorToastMessage } from '../../helper/getErrorToastMessage';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useToast } from '../../components/toast/ToastProvider';
import { routes } from '../../routes';
import { ATTENTION_APPLICATION_STATUSES } from './attentionCenter/attentionCenterData';

const Dashboard = () => {
    const [statusCounts, setStatusCounts] = useState<JobStatusCount[]>([]);
    const [applications, setApplications] = useState<JobApplication[]>([]);
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
                const [jobStatusCounts, jobInterviews, weeklyApplicationCounts, attentionApplications] =
                    await Promise.all([
                        api.application.listJobStatusCounts(),
                        api.interview.listInterviews(),
                        api.application.listWeeklyApplications(),
                        api.application.listApplications({ jobStatuses: [...ATTENTION_APPLICATION_STATUSES] }),
                    ]);

                if (!isActive) {
                    return;
                }

                setStatusCounts(Array.isArray(jobStatusCounts) ? jobStatusCounts : []);
                setApplications(Array.isArray(attentionApplications) ? attentionApplications : []);
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
            applications={applications}
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
