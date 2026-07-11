import { useDraggable } from '@dnd-kit/core';
import PrimaryButton from '../../../../components/button/PrimaryButton';
import formatDate from '../../../../helper/dateFormatter';
import { FIELD_MAX_LENGTHS } from '../../../../helper/formValidation';
import { JOB_STATUS_SORT_ORDER, type JobStatus } from '../../models';
import { getApplicationBoardStatusClassName } from '../../applicationBoard/statusClassNames';
import type { ApplicationBoardCardProps } from './models';
import styles from '../../applicationBoard/ApplicationBoard.module.css';
import BoardCardActions from '../../../../components/boardCardActions/BoardCardActions';

const ApplicationBoardCard = ({
    application,
    hasInterview,
    isArchiving,
    isDeleting,
    isUpdatingStatus,
    note,
    onArchive,
    onDelete,
    onEditNotes,
    onStatusChange,
    upcomingInterviewCount,
}: ApplicationBoardCardProps) => {
    const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
        data: { jobId: application.job_id },
        disabled: isUpdatingStatus,
        id: String(application.job_id),
    });
    const formattedApplicationDate = formatDate(application.application_date);
    const cardClassName = [
        styles.card,
        isDragging ? styles.cardDragging : '',
        isUpdatingStatus ? styles.cardUpdating : '',
    ]
        .filter(Boolean)
        .join(' ');
    const cardTransform = transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)${isDragging ? ' scale(1.01)' : ''}`
        : isDragging
        ? 'scale(1.01)'
        : undefined;
    const cardStyle = cardTransform
        ? {
              transform: cardTransform,
          }
        : undefined;

    return (
        <article
            aria-label={`${application.company_name} ${application.job_title}`}
            className={cardClassName}
            id={String(application.job_id)}
            ref={setNodeRef}
            style={cardStyle}
            {...listeners}
            {...attributes}
        >
            <div className={styles.cardHeader}>
                <h3>{application.company_name}</h3>
                <span className={`${styles.statusBadge} ${getApplicationBoardStatusClassName(application.job_status)}`}>
                    {application.job_status}
                </span>
            </div>

            <p className={styles.jobTitle}>{application.job_title}</p>
            <p className={styles.meta}>{formattedApplicationDate.formattedDay}</p>

            {upcomingInterviewCount > 0 && (
                <span className={styles.upcomingBadge}>
                    {upcomingInterviewCount} Upcoming Interview{upcomingInterviewCount > 1 ? 's' : ''}
                </span>
            )}

            <label className={styles.statusSelectLabel}>
                <span>Move to</span>
                <select
                    aria-label={`Move ${application.company_name} to status`}
                    disabled={isUpdatingStatus}
                    onChange={(event) => void onStatusChange(application, event.target.value as JobStatus)}
                    value={application.job_status}
                >
                    {JOB_STATUS_SORT_ORDER.map((status) => (
                        <option disabled={status === 'Applied' && hasInterview} key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </label>

            <BoardCardActions
                actions={
                    <>
                        <PrimaryButton
                            isLoading={isArchiving}
                            onClick={() => onArchive(application.job_id)}
                            type='button'
                            variant='secondary'
                        >
                            Archive
                        </PrimaryButton>
                        <PrimaryButton
                            isLoading={isDeleting}
                            onClick={() => onDelete(application.job_id)}
                            type='button'
                            variant='destructive'
                        >
                            Delete
                        </PrimaryButton>
                    </>
                }
            >
                {application.job_posting_url !== '' && (
                    <a href={application.job_posting_url} rel='noreferrer noopener' target='_blank'>
                        Open job posting
                    </a>
                )}
                <label className={styles.notesField}>
                    <span>Edit notes</span>
                    <textarea
                        maxLength={FIELD_MAX_LENGTHS.notes}
                        onChange={(event) => onEditNotes(application.job_id, event.target.value)}
                        placeholder='Add your notes here'
                        value={note}
                    />
                </label>
            </BoardCardActions>
        </article>
    );
};

export default ApplicationBoardCard;
