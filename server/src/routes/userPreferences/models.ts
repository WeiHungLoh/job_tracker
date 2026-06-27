import type { JobStatusFilter, UserPreferences } from '../../db/models.js';
import type { ErrorResponse } from '../../http/models.js';

export type UpdateUserPreferencesRequest = {
    application_job_status?: JobStatusFilter;
    application_show_notes?: boolean;
    application_show_archive?: boolean;
    application_enable_scroll?: boolean;
    archived_application_job_status?: JobStatusFilter;
    archived_application_show_notes?: boolean;
};

export type GetUserPreferencesResponse = UserPreferences | ErrorResponse;
export type UpdateUserPreferencesResponse = UserPreferences | ErrorResponse;
