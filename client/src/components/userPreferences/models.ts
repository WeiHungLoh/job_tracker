import type { JobStatus } from '../../pages/application/models';
import type { ApplicationViewMode } from '../activityControls/applicationViewToggle/models';

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

export type GetUserPreferencesRequest = null;
export type GetUserPreferencesResponse = UserPreferences;

export type UpdateUserPreferencesRequest = {
    application_job_statuses?: JobStatus[];
    application_show_notes?: boolean;
    application_show_archive?: boolean;
    application_enable_scroll?: boolean;
    application_view_mode?: ApplicationViewMode;
    archived_application_job_statuses?: JobStatus[];
    archived_application_show_notes?: boolean;
    archived_application_view_mode?: ApplicationViewMode;
    interview_view_mode?: ApplicationViewMode;
    archived_interview_view_mode?: ApplicationViewMode;
};
export type UpdateUserPreferencesResponse = UserPreferences;

export type UserPreferencesContextValue = {
    preferences: UserPreferences;
    updatePreferences: (preferences: UpdateUserPreferencesRequest) => Promise<UserPreferences>;
};
