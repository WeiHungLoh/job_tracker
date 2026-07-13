import type { ArchivedJobApplication, JobApplication, JobStatus } from './models';

type ApplicationCardBaseProps = {
    index: number;
    isDeleting: boolean;
};

export type JobApplicationCardProps = ApplicationCardBaseProps & {
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

export type ArchivedApplicationCardProps = ApplicationCardBaseProps & {
    application: ArchivedJobApplication;
    isUnarchiving: boolean;
    onDelete: (archivedJobId: number) => void | Promise<void>;
    onUnarchive: (archivedJobId: number) => void | Promise<void>;
    showNotes: boolean;
    variant: 'archived';
};

export type ApplicationCardProps = JobApplicationCardProps | ArchivedApplicationCardProps;
