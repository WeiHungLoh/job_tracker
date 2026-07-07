import type { JobApplication, JobStatus } from '../../models';

export type BoardStatusChangeHandler = (application: JobApplication, jobStatus: JobStatus) => void | Promise<void>;

export type ApplicationBoardProps = {
    applications: JobApplication[];
    deletingApplicationIds: ReadonlySet<number>;
    editedNotes: Record<number, string>;
    hasInterview: (jobId: number) => boolean;
    isArchivingApplication: (jobId: number) => boolean;
    isUpdatingApplicationStatus: (jobId: number) => boolean;
    onArchive: (jobId: number) => void | Promise<void>;
    onDelete: (jobId: number) => void | Promise<void>;
    onEditNotes: (jobId: number, notes: string) => void;
    onStatusChange: BoardStatusChangeHandler;
    selectedJobStatuses: readonly JobStatus[];
    upcomingInterviewCountByJob: Record<number, number>;
};

export type ApplicationBoardCardProps = {
    application: JobApplication;
    isArchiving: boolean;
    isDeleting: boolean;
    isUpdatingStatus: boolean;
    note: string;
    hasInterview: boolean;
    onArchive: (jobId: number) => void | Promise<void>;
    onDelete: (jobId: number) => void | Promise<void>;
    onEditNotes: (jobId: number, notes: string) => void;
    onStatusChange: BoardStatusChangeHandler;
    upcomingInterviewCount: number;
};
