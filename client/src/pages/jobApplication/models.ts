import type { JobStatusCount, WeeklyApplicationCount } from '../dashboard/models';

export const JOB_STATUSES = ['Accepted', 'Applied', 'Declined', 'Ghosted', 'Interview', 'Offer', 'Rejected'] as const;
export const JOB_STATUS_FILTER_OPTIONS = ['Show All', ...JOB_STATUSES] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];
export type JobStatusFilter = (typeof JOB_STATUS_FILTER_OPTIONS)[number];

export type JobApplication = {
    job_id: number;
    company_name: string;
    job_title: string;
    application_date: string;
    job_status: JobStatus;
    edit_status: boolean;
    job_location: string;
    job_posting_url: string;
    notes: string;
};

export type ListApplicationsRequest = {
    jobStatus: JobStatusFilter;
};
export type ListApplicationsResponse = JobApplication[];

export type ListWeeklyApplicationsRequest = null;
export type ListWeeklyApplicationsResponse = WeeklyApplicationCount[];

export type ListJobStatusCountsRequest = null;
export type ListJobStatusCountsResponse = JobStatusCount[];

export type CreateApplicationRequest = {
    companyName: string;
    jobTitle: string;
    appDate: Date;
    jobStatus: JobStatus;
    jobLocation: string;
    jobURL: string;
};
export type CreateApplicationResponse = string;

export type DeleteApplicationRequest = {
    applicationId: number;
};
export type DeleteApplicationResponse = null;

export type DeleteAllApplicationsRequest = null;
export type DeleteAllApplicationsResponse = null;

export type UpdateNotesRequest = {
    jobId: number;
    notes: string;
};
export type UpdateNotesResponse = null;

export type UpdateEditStatusRequest = {
    jobId: number;
    editStatus: boolean;
};
export type UpdateEditStatusResponse = null;

export type UpdateJobStatusRequest = {
    jobId: number;
    jobStatus: JobStatus;
};
export type UpdateJobStatusResponse = null;

export type ApplicationCsvHeader = {
    label: string;
    key: string;
};

export const APPLICATION_CSV_HEADERS: ApplicationCsvHeader[] = [
    { label: 'Company', key: 'company_name' },
    { label: 'Job Title', key: 'job_title' },
    { label: 'Application Date', key: 'application_date' },
    { label: 'Status', key: 'job_status' },
    { label: 'Location', key: 'job_location' },
    { label: 'Job URL', key: 'job_posting_url' },
    { label: 'Notes', key: 'notes' },
];
