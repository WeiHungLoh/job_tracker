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
    user_id: number;
    company_name: string;
    job_title: string;
    application_date: Date | null;
    created_at: Date;
    job_status: JobStatus | null;
    edit_status: boolean;
    job_location: string | null;
    job_posting_url: string | null;
    notes: string | null;
    is_archived: boolean;
};

export type ArchivedJobApplication = {
    archived_job_id: number;
    user_id: number;
    company_name: string;
    job_title: string;
    application_date: Date | null;
    created_at: Date;
    job_status: JobStatus | null;
    job_location: string | null;
    job_posting_url: string | null;
    notes: string | null;
};

export type JobInterview = {
    interview_id: number;
    job_id: number;
    user_id: number;
    interview_date: Date;
    interview_location: string;
    interview_type: string | null;
    interview_notes: string | null;
    created_at: Date;
    is_archived: boolean;
    company_name?: string;
    job_title?: string;
    job_status?: JobStatus | null;
};

export type ArchivedJobInterview = {
    archived_interview_id: number;
    archived_job_id: number;
    user_id: number;
    interview_date: Date;
    interview_location: string;
    interview_type: string | null;
    interview_notes: string | null;
    created_at: Date;
    company_name?: string;
    job_title?: string;
    job_status?: JobStatus | null;
};

export type JobStatusCount = {
    job_status: JobStatus | null;
    count: string;
};

export type WeeklyApplicationCount = {
    start_of_week: Date;
    applications_count: string;
};

export type User = {
    user_id: number;
    email: string;
    hashed_password: string;
    created_at: Date;
};

export type UserPreferences = {
    user_id: number;
    application_job_statuses: JobStatus[];
    application_show_notes: boolean;
    application_show_archive: boolean;
    application_enable_scroll: boolean;
    archived_application_job_statuses: JobStatus[];
    archived_application_show_notes: boolean;
};
