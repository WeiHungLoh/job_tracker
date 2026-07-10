import { useMemo } from 'react';
import DashboardCard from './DashboardCard';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import formatDate from '../../helper/dateFormatter';
import type { UpcomingInterviewsProps } from './models';
import { getUpcomingInterviews } from './dashboardData';
import styles from './UpcomingInterviews.module.css';

const MAX_UPCOMING_INTERVIEWS = 3;

const UpcomingInterviews = ({ interviews, isLoading }: UpcomingInterviewsProps) => {
    const upcomingInterviews = useMemo(
        () => getUpcomingInterviews(interviews).slice(0, MAX_UPCOMING_INTERVIEWS),
        [interviews]
    );

    return (
        <DashboardCard title='Upcoming Interviews' description='Your next scheduled conversations.'>
            {isLoading ? (
                <div className={styles.centered}>
                    <LoadingSpinner size='sm' />
                </div>
            ) : upcomingInterviews.length === 0 ? (
                <div className={styles.centered}>
                    <div>
                        <h3>No upcoming interviews</h3>
                        <p>Interviews you add will appear here.</p>
                    </div>
                </div>
            ) : (
                <ol className={styles.interviewList} aria-label='Upcoming interviews list'>
                    {upcomingInterviews.map((interview, index) => (
                        <li key={interview.interview_id}>
                            <span className={styles.index} aria-hidden='true'>
                                {index + 1}
                            </span>
                            <div className={styles.interviewDetails}>
                                <h3>{interview.company_name}</h3>
                                <p className={styles.jobTitle}>{interview.job_title}</p>
                                <time dateTime={interview.interview_date}>
                                    {formatDate(interview.interview_date).formattedDate}
                                </time>
                                {(interview.interview_type || interview.interview_location) && (
                                    <p className={styles.details}>
                                        {[interview.interview_type, interview.interview_location]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </DashboardCard>
    );
};

export default UpcomingInterviews;
