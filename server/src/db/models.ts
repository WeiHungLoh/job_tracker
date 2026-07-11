export type JobStatus = 'Accepted' | 'Applied' | 'Declined' | 'Ghosted' | 'Interview' | 'Offer' | 'Rejected';
export type ApplicationViewMode = 'list' | 'board';

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
    application_date: Date;
    job_status: JobStatus;
    edit_status: boolean;
    job_location: string;
    job_posting_url: string;
    notes: string;
};

export type ArchivedJobApplication = {
    archived_job_id: number;
    company_name: string;
    job_title: string;
    application_date: Date;
    job_status: JobStatus;
    job_location: string;
    job_posting_url: string;
    notes: string;
};

export type JobInterview = {
    interview_id: number;
    job_id: number;
    interview_date: Date;
    interview_location: string;
    interview_type: string;
    interview_notes: string;
    company_name: string;
    job_title: string;
    job_status: JobStatus;
};

export type ArchivedJobInterview = {
    archived_interview_id: number;
    archived_job_id: number;
    interview_date: Date;
    interview_location: string;
    interview_type: string;
    interview_notes: string;
    company_name: string;
    job_title: string;
    job_status: JobStatus;
};

export type JobStatusCount = {
    job_status: JobStatus;
    count: string;
};

export type WeeklyApplicationCount = {
    start_of_week: Date;
    applications_count: string;
};

export type ApplicationCollectionSummary = {
    application_count: number;
    related_interview_count: number;
};

export type InterviewCollectionSummary = {
    interview_count: number;
};

export type User = {
    user_id: number;
    email: string;
    hashed_password: string;
};

export type UserPreferences = {
    application_job_statuses: JobStatus[];
    application_show_notes: boolean;
    application_show_archive: boolean;
    application_enable_scroll: boolean;
    application_view_mode: ApplicationViewMode;
    archived_application_job_statuses: JobStatus[];
    archived_application_show_notes: boolean;
    archived_application_view_mode: ApplicationViewMode;
    interview_view_mode: ApplicationViewMode;
    archived_interview_view_mode: ApplicationViewMode;
};
