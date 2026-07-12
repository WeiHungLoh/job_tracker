import { useNavigate } from 'react-router-dom';
import DashboardContent from '../../dashboard/DashboardContent';
import type { JobStatus } from '../../application/models';
import type {
    DashboardApplicationNavigationState,
    DashboardInterviewNavigationState,
} from '../../../helper/dashboardNavigation';
import { selectJobStatusCounts, selectWeeklyApplications } from '../state/demoSelectors';
import { useDemo } from '../context/DemoContext';
import { routes } from '../../../routes';

const DemoDashboard = () => {
    const { state } = useDemo();
    const statusCounts = selectJobStatusCounts(state);
    const weeklyApplications = selectWeeklyApplications(state);
    const navigate = useNavigate();

    const handleStatusSelect = (status: JobStatus) => {
        const navigationState: DashboardApplicationNavigationState = { dashboardJobStatus: status };
        navigate(routes.demoViewApplications, { state: navigationState });
    };

    const handleInterviewSelect = (interviewId: number) => {
        const navigationState: DashboardInterviewNavigationState = { dashboardInterviewId: interviewId };
        navigate(routes.demoViewInterviews, { state: navigationState });
    };

    return (
        <DashboardContent
            statusCounts={statusCounts}
            interviews={state.interviews}
            weeklyApplications={weeklyApplications}
            isLoading={false}
            onInterviewSelect={handleInterviewSelect}
            onStatusSelect={handleStatusSelect}
        />
    );
};

export default DemoDashboard;
