import type { JobStatus } from '../jobApplication/models';

export type ArchivedJobApplication = {
    archived_job_id: number;
    company_name: string;
    job_title: string;
    application_date: string;
    job_status: JobStatus;
    job_location: string;
    job_posting_url: string;
    notes: string;
};

export type ArchivedJobInterview = {
    archived_interview_id: number;
    archived_job_id: number;
    company_name: string;
    job_title: string;
    interview_date: string;
    interview_location: string;
    interview_type: string;
    interview_notes: string;
    notes?: string;
};

export type ListArchivedApplicationsRequest = null;
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
