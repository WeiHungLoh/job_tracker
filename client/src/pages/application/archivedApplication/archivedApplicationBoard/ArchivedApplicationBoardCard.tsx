import PrimaryButton from '../../../../components/button/PrimaryButton';
import formatDate from '../../../../helper/dateFormatter';
import { getApplicationBoardStatusClassName } from '../../applicationBoard/statusClassNames';
import type { ArchivedApplicationBoardCardProps } from './models';
import styles from '../../applicationBoard/ApplicationBoard.module.css';

const EMPTY_NOTES_MESSAGE = 'You do not have any notes here';

const ArchivedApplicationBoardCard = ({
    application,
    isDeleting,
    isUnarchiving,
    onDelete,
    onUnarchive,
    showNotes,
}: ArchivedApplicationBoardCardProps) => {
    const formattedApplicationDate = formatDate(application.application_date);
    const notesValue = application.notes.trim() === '' ? EMPTY_NOTES_MESSAGE : application.notes;
    const hasActions = application.job_posting_url !== '' || showNotes;

    return (
        <article
            aria-label={`${application.company_name} ${application.job_title}`}
            className={`${styles.card} ${styles.readOnlyCard}`}
            id={String(application.archived_job_id)}
        >
            <div className={styles.cardHeader}>
                <h3>{application.company_name}</h3>
                <span className={`${styles.statusBadge} ${getApplicationBoardStatusClassName(application.job_status)}`}>
                    {application.job_status}
                </span>
            </div>

            <p className={styles.jobTitle}>{application.job_title}</p>
            <p className={styles.meta}>{formattedApplicationDate.formattedDay}</p>

            <details className={styles.actions}>
                <summary>Actions</summary>
                <div className={styles.actionPanel}>
                    {hasActions && (
                        <>
                            {application.job_posting_url !== '' && (
                                <a href={application.job_posting_url} rel='noreferrer noopener' target='_blank'>
                                    Open job posting
                                </a>
                            )}
                            {showNotes && (
                                <label className={`${styles.notesField} ${styles.readOnlyNotes}`}>
                                    <span>Notes</span>
                                    <textarea disabled readOnly value={notesValue} />
                                </label>
                            )}
                        </>
                    )}
                    <div className={styles.actionButtons}>
                        <PrimaryButton
                            isLoading={isUnarchiving}
                            onClick={() => onUnarchive(application.archived_job_id)}
                            type='button'
                            variant='secondary'
                        >
                            Unarchive
                        </PrimaryButton>
                        <PrimaryButton
                            isLoading={isDeleting}
                            onClick={() => onDelete(application.archived_job_id)}
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

export default ArchivedApplicationBoardCard;
