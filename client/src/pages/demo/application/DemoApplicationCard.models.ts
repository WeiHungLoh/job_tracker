import type { ArchivedJobApplication, JobApplication, JobStatus } from '../../application/models';

type DemoApplicationCardBaseProps = {
    index: number;
    isDeleting: boolean;
};

export type DemoJobApplicationCardProps = DemoApplicationCardBaseProps & {
    application: JobApplication;
    editedJobStatus: JobStatus;
    hasInterview: boolean;
    isArchiving: boolean;
    isEditingStatus: boolean;
    note: string;
    onArchive: (jobId: number) => void | Promise<void>;
    onDelete: (jobId: number) => void | Promise<void>;
    onEditNotes: (jobId: number, notes: string) => void;
    onJobStatusChange: (jobStatus: JobStatus) => void;
    onToggleStatusEditor: (application: JobApplication) => void | Promise<void>;
    showArchive: boolean;
    showNotes: boolean;
    upcomingInterviewCount: number;
    variant: 'job';
};

export type DemoArchivedApplicationCardProps = DemoApplicationCardBaseProps & {
    application: ArchivedJobApplication;
    isRestoring: boolean;
    onDelete: (archivedJobId: number) => void | Promise<void>;
    onRestore: (archivedJobId: number) => void | Promise<void>;
    showNotes: boolean;
    variant: 'archived';
};

export type DemoApplicationCardProps = DemoJobApplicationCardProps | DemoArchivedApplicationCardProps;
