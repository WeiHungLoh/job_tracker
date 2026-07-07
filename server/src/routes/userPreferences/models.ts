import type { ApplicationViewMode, JobStatus, UserPreferences } from '../../db/models.js';
import type { ErrorResponse } from '../../http/models.js';

export type UpdateUserPreferencesRequest = {
    application_job_statuses?: JobStatus[];
    application_show_notes?: boolean;
    application_show_archive?: boolean;
    application_enable_scroll?: boolean;
    application_view_mode?: ApplicationViewMode;
    archived_application_job_statuses?: JobStatus[];
    archived_application_show_notes?: boolean;
    archived_application_view_mode?: ApplicationViewMode;
};

export type GetUserPreferencesResponse = UserPreferences | ErrorResponse;
export type UpdateUserPreferencesResponse = UserPreferences | ErrorResponse;
