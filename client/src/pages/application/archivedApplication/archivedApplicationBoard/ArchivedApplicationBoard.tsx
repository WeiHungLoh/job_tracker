import ApplicationBoardColumn from '../../applicationBoard/ApplicationBoardColumn';
import ArchivedApplicationBoardCard from './ArchivedApplicationBoardCard';
import { getOrderedBoardStatuses, groupApplicationsByStatus } from '../../applicationBoard/applicationBoardUtils';
import type { ArchivedApplicationBoardProps } from './models';
import styles from '../../applicationBoard/ApplicationBoard.module.css';

const ArchivedApplicationBoard = ({
    applications,
    deletingApplicationIds,
    onDelete,
    onUnarchive,
    selectedJobStatuses,
    showNotes,
    unarchivingApplicationIds,
}: ArchivedApplicationBoardProps) => {
    const groupedApplications = groupApplicationsByStatus(applications);
    const boardStatuses = getOrderedBoardStatuses(selectedJobStatuses);

    return (
        <div aria-label='Archived application board' className={styles.board} role='region'>
            {boardStatuses.map((status) => {
                const statusApplications = groupedApplications[status];

                return (
                    <ApplicationBoardColumn
                        applications={statusApplications}
                        droppable={false}
                        key={status}
                        status={status}
                    >
                        {statusApplications.map((application) => (
                            <ArchivedApplicationBoardCard
                                application={application}
                                isDeleting={deletingApplicationIds.has(application.archived_job_id)}
                                isUnarchiving={unarchivingApplicationIds.has(application.archived_job_id)}
                                key={application.archived_job_id}
                                onDelete={onDelete}
                                onUnarchive={onUnarchive}
                                showNotes={showNotes}
                            />
                        ))}
                    </ApplicationBoardColumn>
                );
            })}
        </div>
    );
};

export default ArchivedApplicationBoard;
