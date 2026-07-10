import DashboardContent from '../../dashboard/DashboardContent';
import { selectJobStatusCounts, selectWeeklyApplications } from '../state/demoSelectors';
import { useDemo } from '../context/DemoContext';

const DemoDashboard = () => {
    const { state } = useDemo();
    const statusCounts = selectJobStatusCounts(state);
    const weeklyApplications = selectWeeklyApplications(state);

    return (
        <DashboardContent
            statusCounts={statusCounts}
            interviews={state.interviews}
            weeklyApplications={weeklyApplications}
            isLoading={false}
        />
    );
};

export default DemoDashboard;
