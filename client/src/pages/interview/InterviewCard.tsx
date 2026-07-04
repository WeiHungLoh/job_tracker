import { Link } from 'react-router-dom';
import PrimaryButton from '../../components/button/PrimaryButton';
import formatDate from '../../helper/dateFormatter';
import { routes } from '../../routes';
import type { InterviewCardProps } from './InterviewCard.models';
import CalendarOptions from './calendarOptions/CalendarOptions';
import { isFutureInterviewDate } from './calendarOptions/calendarEvent';
import styles from './InterviewCard.module.css';

const InterviewCard = ({
    index,
    interview,
    isDeleting,
    onDelete,
    onViewApplicationClick,
    variant,
}: InterviewCardProps) => {
    const applicationId = variant === 'job' ? interview.job_id : interview.archived_job_id;
    const applicationRoute = variant === 'job' ? routes.viewApplications : routes.archivedApplications;
    const formattedInterviewDate = formatDate(interview.interview_date);
    const showCalendarOptions = variant === 'job' && isFutureInterviewDate(interview.interview_date);

    return (
        <div className={`${styles.interview} ${variant === 'archived' ? styles.archived : ''}`}>
            <div className={styles.interviewContent}>
                <h2>
                    {index + 1}. {interview.company_name}
                </h2>
                <p>Job Title: {interview.job_title}</p>
                <p className={styles.location}>Location: {interview.interview_location}</p>
                {interview.interview_type !== '' && (
                    <p className={styles.type}>Interview Type: {interview.interview_type}</p>
                )}
                {interview.interview_notes !== '' && <p className={styles.notes}>Notes: {interview.interview_notes}</p>}
                <p className={styles.date}>Interview Date: {formattedInterviewDate.formattedDate}</p>
                <p>Time left: {formattedInterviewDate.timeBeforeInterview}</p>
                <Link to={`${applicationRoute}#${applicationId}`} onClick={onViewApplicationClick}>
                    Click here to review corresponding job application
                </Link>
            </div>

            <div className={styles.buttonGroup}>
                {showCalendarOptions && <CalendarOptions interview={interview} />}
                <PrimaryButton isLoading={isDeleting} variant='destructive' onClick={onDelete}>
                    Delete
                </PrimaryButton>
            </div>
        </div>
    );
};

export default InterviewCard;
