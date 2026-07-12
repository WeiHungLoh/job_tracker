export type JobStatus = 'Accepted' | 'Applied' | 'Declined' | 'Ghosted' | 'Interview' | 'Offer' | 'Rejected';
export type ApplicationViewMode = 'list' | 'board';

export const APPLICATION_LIST_SORT_ORDERS = [
    'job_status',
    'application_date_desc',
    'application_date_asc',
    'company_name_asc',
    'company_name_desc',
] as const;

export type ApplicationListSortOrder = (typeof APPLICATION_LIST_SORT_ORDERS)[number];
export type ApplicationBoardSortOrder = Exclude<ApplicationListSortOrder, 'job_status'>;

export const APPLICATION_BOARD_SORT_ORDERS: readonly ApplicationBoardSortOrder[] = APPLICATION_LIST_SORT_ORDERS.filter(
    (sortOrder): sortOrder is ApplicationBoardSortOrder => sortOrder !== 'job_status'
);

export const DEFAULT_APPLICATION_LIST_SORT_ORDER: ApplicationListSortOrder = 'job_status';
export const DEFAULT_APPLICATION_BOARD_SORT_ORDER: ApplicationBoardSortOrder = 'application_date_desc';

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
    application_list_sort_order: ApplicationListSortOrder;
    application_board_sort_order: ApplicationBoardSortOrder;
    archived_application_job_statuses: JobStatus[];
    archived_application_show_notes: boolean;
    archived_application_view_mode: ApplicationViewMode;
    archived_application_list_sort_order: ApplicationListSortOrder;
    archived_application_board_sort_order: ApplicationBoardSortOrder;
    interview_view_mode: ApplicationViewMode;
    archived_interview_view_mode: ApplicationViewMode;
};
