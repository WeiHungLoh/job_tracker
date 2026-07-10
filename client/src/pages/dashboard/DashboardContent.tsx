import ApplicationPipelineChart from './ApplicationPipelineChart';
import ApplicationsLineChart from './ApplicationsLineChart';
import ClosedOutcomesChart from './ClosedOutcomesChart';
import DashboardStats from './DashboardStats';
import UpcomingInterviews from './UpcomingInterviews';
import type { DashboardContentProps } from './models';
import styles from './Dashboard.module.css';

const DashboardContent = ({ statusCounts, interviews, weeklyApplications, isLoading }: DashboardContentProps) => {
    return (
        <div className={styles.dashboard}>
            <section className={styles.statsSection} aria-label='Dashboard statistics'>
                <DashboardStats
                    statusCounts={statusCounts}
                    interviews={interviews}
                    weeklyApplications={weeklyApplications}
                    isLoading={isLoading}
                />
            </section>
            <section className={styles.trendSection}>
                <ApplicationsLineChart weeklyApplications={weeklyApplications} isLoading={isLoading} />
            </section>
            <section className={styles.interviewsSection}>
                <UpcomingInterviews interviews={interviews} isLoading={isLoading} />
            </section>
            <section className={styles.pipelineSection}>
                <ApplicationPipelineChart statusCounts={statusCounts} isLoading={isLoading} />
            </section>
            <section className={styles.closedSection}>
                <ClosedOutcomesChart statusCounts={statusCounts} isLoading={isLoading} />
            </section>
        </div>
    );
};

export default DashboardContent;
