import ApplicationPipelineChart from './ApplicationPipelineChart';
import ApplicationsLineChart from './ApplicationsLineChart';
import ClosedOutcomesChart from './ClosedOutcomesChart';
import DashboardStats from './DashboardStats';
import UpcomingInterviews from './UpcomingInterviews';
import type { DashboardContentProps } from './models';
import styles from './Dashboard.module.css';
import useCurrentTime from '../../hooks/useCurrentTime';

const DashboardContent = ({
    statusCounts,
    interviews,
    weeklyApplications,
    isLoading,
    onInterviewSelect,
    onStatusSelect,
}: DashboardContentProps) => {
    const currentTime = useCurrentTime();

    return (
        <div className={styles.dashboard}>
            <section className={styles.statsSection} aria-label='Dashboard statistics'>
                <DashboardStats
                    currentTime={currentTime}
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
                <UpcomingInterviews
                    currentTime={currentTime}
                    interviews={interviews}
                    isLoading={isLoading}
                    onInterviewSelect={onInterviewSelect}
                />
            </section>
            <section className={styles.pipelineSection}>
                <ApplicationPipelineChart
                    statusCounts={statusCounts}
                    isLoading={isLoading}
                    onStatusSelect={onStatusSelect}
                />
            </section>
            <section className={styles.closedSection}>
                <ClosedOutcomesChart
                    statusCounts={statusCounts}
                    isLoading={isLoading}
                    onStatusSelect={onStatusSelect}
                />
            </section>
        </div>
    );
};

export default DashboardContent;
