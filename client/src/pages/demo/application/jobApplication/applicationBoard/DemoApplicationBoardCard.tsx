import { useDraggable } from '@dnd-kit/core';
import PrimaryButton from '../../../../../components/button/PrimaryButton';
import Icon from '../../../../../components/icon/Icon';
import formatDate from '../../../../../helper/dateFormatter';
import { FIELD_MAX_LENGTHS } from '../../../../../helper/formValidation';
import { JOB_STATUS_SORT_ORDER, type JobApplication, type JobStatus } from '../../../../application/models';
import { getApplicationBoardStatusClassName } from '../../../../application/applicationBoard/statusClassNames';
import styles from '../../applicationBoard/DemoApplicationBoard.module.css';

type DemoApplicationBoardCardProps = {
    application: JobApplication;
    hasInterview: boolean;
    isArchiving: boolean;
    isDeleting: boolean;
    note: string;
    onArchive: (jobId: number) => void | Promise<void>;
    onDelete: (jobId: number) => void | Promise<void>;
    onEditNotes: (jobId: number, notes: string) => void;
    onStatusChange: (application: JobApplication, jobStatus: JobStatus) => void | Promise<void>;
    upcomingInterviewCount: number;
};

const DemoApplicationBoardCard = ({
    application,
    hasInterview,
    isArchiving,
    isDeleting,
    note,
    onArchive,
    onDelete,
    onEditNotes,
    onStatusChange,
    upcomingInterviewCount,
}: DemoApplicationBoardCardProps) => {
    const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform } = useDraggable({
        data: { jobId: application.job_id },
        id: String(application.job_id),
    });
    const formattedApplicationDate = formatDate(application.application_date);
    const cardClassName = [styles.card, isDragging ? styles.cardDragging : ''].filter(Boolean).join(' ');
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
        >
            <div className={styles.cardHeader}>
                <h3>{application.company_name}</h3>
                <div className={styles.cardHeaderControls}>
                    <span
                        className={`${styles.statusBadge} ${getApplicationBoardStatusClassName(
                            application.job_status
                        )}`}
                    >
                        {application.job_status}
                    </span>
                    <button
                        aria-label={`Drag ${application.company_name} ${application.job_title} application`}
                        className={styles.dragHandle}
                        ref={setActivatorNodeRef}
                        type='button'
                        {...listeners}
                        {...attributes}
                    >
                        <Icon name='dragHandle' />
                    </button>
                </div>
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

            <details className={styles.actions}>
                <summary>Actions</summary>
                <div className={styles.actionPanel}>
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
                    <div className={styles.actionButtons}>
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
                    </div>
                </div>
            </details>
        </article>
    );
};

export default DemoApplicationBoardCard;
