import type { JobApplication, JobStatusFilter } from '../jobApplication/models';
import type { JobInterview } from '../interview/models';

export type ArchivedJobApplication = Omit<JobApplication, 'job_id' | 'edit_status'> & {
    archived_job_id: number;
};

export type ArchivedJobInterview = Omit<JobInterview, 'interview_id' | 'job_id'> & {
    archived_interview_id: number;
    archived_job_id: number;
};

export type ListArchivedApplicationsRequest = {
    jobStatus: JobStatusFilter;
};
export type ListArchivedApplicationsResponse = ArchivedJobApplication[];

export type ArchiveApplicationRequest = {
    jobId: number;
};
export type ArchiveApplicationResponse = string;

export type DeleteArchivedApplicationRequest = {
    archivedApplicationId: number;
};
export type DeleteArchivedApplicationResponse = null;

export type DeleteAllArchivedApplicationsRequest = null;
export type DeleteAllArchivedApplicationsResponse = null;

export type UnarchiveApplicationRequest = {
    archivedJobId: number;
};
export type UnarchiveApplicationResponse = string;

export type ListArchivedInterviewsRequest = null;
export type ListArchivedInterviewsResponse = ArchivedJobInterview[];

export type DeleteArchivedInterviewRequest = {
    interviewId: number;
};
export type DeleteArchivedInterviewResponse = null;

export type DeleteAllArchivedInterviewsRequest = null;
export type DeleteAllArchivedInterviewsResponse = null;
