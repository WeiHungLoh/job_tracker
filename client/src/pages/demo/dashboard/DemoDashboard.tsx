import ApplicationsLineChart from '../../dashboard/ApplicationsLineChart';
import DashboardStats from '../../dashboard/DashboardStats';
import JobStatusChart from '../../dashboard/JobStatusChart';
import { selectJobStatusCounts, selectWeeklyApplications } from '../state/demoSelectors';
import styles from './DemoDashboard.module.css';
import { useDemo } from '../context/DemoContext';

const DemoDashboard = () => {
    const { state } = useDemo();
    const statusCounts = selectJobStatusCounts(state);
    const weeklyApplications = selectWeeklyApplications(state);

    return (
        <div className={styles.dashboard}>
            <DashboardStats
                statusCounts={statusCounts}
                interviews={state.interviews}
                weeklyApplications={weeklyApplications}
                isLoading={false}
            />
            <ApplicationsLineChart weeklyApplications={weeklyApplications} isLoading={false} />
            <JobStatusChart statusCounts={statusCounts} isLoading={false} />
        </div>
    );
};

export default DemoDashboard;
