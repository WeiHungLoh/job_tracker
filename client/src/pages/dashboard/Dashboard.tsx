import ApplicationsLineChart from './ApplicationsLineChart';
import JobStatusChart from './JobStatusChart';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    return (
        <div className={styles.dashboard}>
            <ApplicationsLineChart />
            <JobStatusChart />
        </div>
    );
};

export default Dashboard;
