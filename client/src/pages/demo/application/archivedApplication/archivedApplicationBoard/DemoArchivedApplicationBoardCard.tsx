import BoardCardActions from '../../../../../components/boardCardActions/BoardCardActions';
import PrimaryButton from '../../../../../components/button/PrimaryButton';
import formatDate from '../../../../../helper/dateFormatter';
import type { ArchivedJobApplication } from '../../../../application/models';
import { getApplicationBoardStatusClassName } from '../../../../application/applicationBoard/statusClassNames';
import styles from '../../applicationBoard/DemoApplicationBoard.module.css';

const EMPTY_NOTES_MESSAGE = 'You do not have any notes here';

type DemoArchivedApplicationBoardCardProps = {
    application: ArchivedJobApplication;
    isDeleting: boolean;
    isRestoring: boolean;
    onDelete: (archivedJobId: number) => void | Promise<void>;
    onRestore: (archivedJobId: number) => void | Promise<void>;
    showNotes: boolean;
};

const DemoArchivedApplicationBoardCard = ({
    application,
    isDeleting,
    isRestoring,
    onDelete,
    onRestore,
    showNotes,
}: DemoArchivedApplicationBoardCardProps) => {
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

            <BoardCardActions
                actions={
                    <>
                        <PrimaryButton
                            isLoading={isRestoring}
                            onClick={() => onRestore(application.archived_job_id)}
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
                    </>
                }
            >
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
            </BoardCardActions>
        </article>
    );
};

export default DemoArchivedApplicationBoardCard;
