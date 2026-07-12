import { Link } from 'react-router-dom';
import PrimaryButton from '../../components/button/PrimaryButton';
import formatDate from '../../helper/dateFormatter';
import type { InterviewCardProps } from './InterviewCard.models';
import CalendarOptions from './calendarOptions/CalendarOptions';
import { isFutureInterviewDate, isOverdueInterviewDate } from './calendarOptions/calendarEvent';
import styles from './InterviewCard.module.css';
import BoardCardActions from '../../components/boardCardActions/BoardCardActions';

const InterviewCard = ({
    applicationRoute,
    index,
    interview,
    isDeleting,
    layout = 'list',
    onDelete,
    onViewApplicationClick,
    variant,
}: InterviewCardProps) => {
    const applicationId = variant === 'job' ? interview.job_id : interview.archived_job_id;
    const formattedInterviewDate = formatDate(interview.interview_date);
    const showCalendarOptions = variant === 'job' && isFutureInterviewDate(interview.interview_date);
    const isOverdue = isOverdueInterviewDate(interview.interview_date);
    const isBoardLayout = layout === 'board';
    const cardClasses = [
        styles.interview,
        variant === 'archived' ? styles.archived : '',
        isBoardLayout ? styles.board : '',
        isOverdue ? styles.overdue : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <article
            aria-label={`${interview.company_name} interview`}
            className={cardClasses}
            id={variant === 'job' ? String(interview.interview_id) : undefined}
        >
            <div className={styles.interviewContent}>
                <h2>
                    {index + 1}. {interview.company_name}
                </h2>
                <p>Job Title: {interview.job_title}</p>
                <p className={styles.location}>Location: {interview.interview_location}</p>
                {interview.interview_type !== '' && (
                    <p className={styles.type}>Interview Type: {interview.interview_type}</p>
                )}
                {!isBoardLayout && interview.interview_notes !== '' && (
                    <p className={styles.notes}>Notes: {interview.interview_notes}</p>
                )}
                <p className={styles.date}>Interview Date: {formattedInterviewDate.formattedDate}</p>
                {!isBoardLayout && (
                    <>
                        <p className={styles.timeLeft}>Time left: {formattedInterviewDate.timeBeforeInterview}</p>
                        <Link to={`${applicationRoute}#${applicationId}`} onClick={onViewApplicationClick}>
                            Click here to review corresponding job application
                        </Link>
                    </>
                )}
            </div>

            {isBoardLayout ? (
                <BoardCardActions
                    actions={
                        <>
                            {showCalendarOptions && <CalendarOptions interview={interview} />}
                            <PrimaryButton isLoading={isDeleting} variant='destructive' onClick={onDelete}>
                                Delete
                            </PrimaryButton>
                        </>
                    }
                    compactActions
                />
            ) : (
                <div className={styles.buttonGroup}>
                    {showCalendarOptions && <CalendarOptions interview={interview} />}
                    <PrimaryButton isLoading={isDeleting} variant='destructive' onClick={onDelete}>
                        Delete
                    </PrimaryButton>
                </div>
            )}
        </article>
    );
};

export default InterviewCard;
