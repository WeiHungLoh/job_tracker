export type EntityId = number;

export type JobStatus = 'Accepted' | 'Applied' | 'Declined' | 'Ghosted' | 'Interview' | 'Offer' | 'Rejected';

export type JobApplication = {
    job_id: EntityId;
    user_id: EntityId;
    company_name: string;
    job_title: string;
    application_date: Date | null;
    job_status: JobStatus | null;
    edit_status: boolean;
    job_location: string | null;
    job_posting_url: string | null;
    notes: string | null;
    is_archived: boolean;
};

export type ArchivedJobApplication = Omit<JobApplication, 'edit_status' | 'is_archived' | 'job_id'> & {
    archived_job_id: EntityId;
};

export type JobInterview = {
    interview_id: EntityId;
    job_id: EntityId;
    user_id: EntityId;
    interview_date: Date;
    interview_location: string;
    interview_type: string | null;
    interview_notes: string | null;
    created_at: Date;
    is_archived: boolean;
    company_name?: string;
    job_title?: string;
};

export type ArchivedJobInterview = Omit<JobInterview, 'interview_id' | 'is_archived' | 'job_id'> & {
    archived_interview_id: EntityId;
    archived_job_id: EntityId;
};

export type JobStatusCount = {
    job_status: JobStatus | null;
    count: string;
};

export type WeeklyApplicationCount = {
    start_of_week: Date;
    applications_count: string | number;
};

export type User = {
    user_id: EntityId;
    email: string;
    hashed_password: string;
    sorting_preferences: 'DEFAULT' | 'APPLICATION_DATE';
    created_at: Date;
};
