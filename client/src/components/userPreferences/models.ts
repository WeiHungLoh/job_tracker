import type { JobStatusFilter } from '../../pages/jobApplication/models';

export type UserPreferences = {
    user_id: number;
    application_job_status: JobStatusFilter;
    application_show_notes: boolean;
    application_show_archive: boolean;
    application_enable_scroll: boolean;
    archived_application_job_status: JobStatusFilter;
    archived_application_show_notes: boolean;
};

export type GetUserPreferencesRequest = null;
export type GetUserPreferencesResponse = UserPreferences;

export type UpdateUserPreferencesRequest = {
    application_job_status?: JobStatusFilter;
    application_show_notes?: boolean;
    application_show_archive?: boolean;
    application_enable_scroll?: boolean;
    archived_application_job_status?: JobStatusFilter;
    archived_application_show_notes?: boolean;
};
export type UpdateUserPreferencesResponse = UserPreferences;

export type UserPreferencesContextValue = {
    preferences: UserPreferences;
    updatePreferences: (preferences: UpdateUserPreferencesRequest) => Promise<UserPreferences>;
};
