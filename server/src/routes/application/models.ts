import type {
    ApplicationCollectionSummary,
    JobApplication,
    JobStatus,
    JobStatusCount,
    WeeklyApplicationCount,
} from '../../db/models.js';
import type { ErrorResponse } from '../../http/models.js';
export type { EmptyResponse } from '../../http/models.js';

export type JobIdParams = {
    jobId: string;
};

export type ListApplicationsQuery = {
    jobStatuses?: string | string[];
};

export type CreateApplicationRequest = {
    companyName: string;
    jobTitle: string;
    appDate: string;
    jobStatus: JobStatus;
    jobLocation: string;
    jobURL: string;
};

export type UpdateNotesRequest = {
    notes: string;
};

export type UpdateApplicationStatusRequest = {
    editStatus: boolean;
    jobStatus: JobStatus;
};

export type CreateApplicationResponse = string | ErrorResponse;
export type ListApplicationsResponse = JobApplication[] | ErrorResponse;
export type ListJobStatusCountsResponse = JobStatusCount[] | ErrorResponse;
export type ListWeeklyApplicationsResponse = WeeklyApplicationCount[] | ErrorResponse;
export type GetApplicationCollectionSummaryResponse = ApplicationCollectionSummary | ErrorResponse;
