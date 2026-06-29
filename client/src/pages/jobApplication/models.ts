import type { JobStatusCount, WeeklyApplicationCount } from '../dashboard/models';

export type JobStatus = 'Accepted' | 'Applied' | 'Declined' | 'Ghosted' | 'Interview' | 'Offer' | 'Rejected';

export const JOB_STATUSES: readonly JobStatus[] = [
    'Accepted',
    'Applied',
    'Declined',
    'Ghosted',
    'Interview',
    'Offer',
    'Rejected',
];

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
    jobStatuses: JobStatus[];
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
    jobId: number;
};
export type DeleteApplicationResponse = null;

export type DeleteAllApplicationsRequest = null;
export type DeleteAllApplicationsResponse = null;

export type UpdateNotesRequest = {
    jobId: number;
    notes: string;
};
export type UpdateNotesResponse = null;

export type UpdateApplicationStatusRequest = {
    jobId: number;
    editStatus: boolean;
    jobStatus: JobStatus;
};
export type UpdateApplicationStatusResponse = null;

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
