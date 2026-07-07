import type { ArchivedJobApplication, JobStatus } from '../../models';

export type ArchivedApplicationBoardProps = {
    applications: ArchivedJobApplication[];
    deletingApplicationIds: ReadonlySet<number>;
    onDelete: (archivedJobId: number) => void | Promise<void>;
    onUnarchive: (archivedJobId: number) => void | Promise<void>;
    selectedJobStatuses: readonly JobStatus[];
    showNotes: boolean;
    unarchivingApplicationIds: ReadonlySet<number>;
};

export type ArchivedApplicationBoardCardProps = {
    application: ArchivedJobApplication;
    isDeleting: boolean;
    isUnarchiving: boolean;
    onDelete: (archivedJobId: number) => void | Promise<void>;
    onUnarchive: (archivedJobId: number) => void | Promise<void>;
    showNotes: boolean;
};
