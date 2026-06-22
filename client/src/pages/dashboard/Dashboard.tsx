import ApplicationsLineChart from './ApplicationsLineChart';
import DashboardStats from './DashboardStats';
import JobStatusChart from './JobStatusChart';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    return (
        <div className={styles.dashboard}>
            <DashboardStats />
            <ApplicationsLineChart />
            <JobStatusChart />
        </div>
    );
};

export default Dashboard;
