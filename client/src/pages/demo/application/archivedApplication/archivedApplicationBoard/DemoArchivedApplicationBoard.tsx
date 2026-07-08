import {
    getOrderedBoardStatuses,
    groupApplicationsByStatus,
} from '../../../../application/applicationBoard/applicationBoardUtils';
import type { ArchivedJobApplication, JobStatus } from '../../../../application/models';
import DemoApplicationBoardColumn from '../../applicationBoard/DemoApplicationBoardColumn';
import DemoArchivedApplicationBoardCard from './DemoArchivedApplicationBoardCard';
import styles from '../../applicationBoard/DemoApplicationBoard.module.css';

type DemoArchivedApplicationBoardProps = {
    applications: ArchivedJobApplication[];
    deletingApplicationIds: ReadonlySet<number>;
    onDelete: (archivedJobId: number) => void | Promise<void>;
    onRestore: (archivedJobId: number) => void | Promise<void>;
    restoringApplicationIds: ReadonlySet<number>;
    selectedJobStatuses: readonly JobStatus[];
    showNotes: boolean;
};

const DemoArchivedApplicationBoard = ({
    applications,
    deletingApplicationIds,
    onDelete,
    onRestore,
    restoringApplicationIds,
    selectedJobStatuses,
    showNotes,
}: DemoArchivedApplicationBoardProps) => {
    const groupedApplications = groupApplicationsByStatus(applications);
    const boardStatuses = getOrderedBoardStatuses(selectedJobStatuses);

    return (
        <div aria-label='Archived application board' className={styles.board} role='region'>
            {boardStatuses.map((status) => {
                const statusApplications = groupedApplications[status];

                return (
                    <DemoApplicationBoardColumn
                        applications={statusApplications}
                        droppable={false}
                        key={status}
                        status={status}
                    >
                        {statusApplications.map((application) => (
                            <DemoArchivedApplicationBoardCard
                                application={application}
                                isDeleting={deletingApplicationIds.has(application.archived_job_id)}
                                isRestoring={restoringApplicationIds.has(application.archived_job_id)}
                                key={application.archived_job_id}
                                onDelete={onDelete}
                                onRestore={onRestore}
                                showNotes={showNotes}
                            />
                        ))}
                    </DemoApplicationBoardColumn>
                );
            })}
        </div>
    );
};

export default DemoArchivedApplicationBoard;
