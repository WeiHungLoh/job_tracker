import type { UpdateUserPreferencesRequest } from '../../routes/userPreferences/models.js';
import type { UserPreferences } from '../models.js';
import { pool } from '../connectDB.js';

export const getUserPreferences = async (userId: number): Promise<UserPreferences | undefined> => {
    const result = await pool.query<UserPreferences>(
        `SELECT
            application_job_statuses,
            application_show_notes,
            application_show_archive,
            application_enable_scroll,
            application_view_mode,
            archived_application_job_statuses,
            archived_application_show_notes,
            archived_application_view_mode
         FROM user_preferences
         WHERE user_id = $1`,
        [userId]
    );

    return result.rows[0];
};

export const updateUserPreferences = async (
    userId: number,
    preferences: UpdateUserPreferencesRequest
): Promise<UserPreferences | undefined> => {
    const result = await pool.query<UserPreferences>(
        `UPDATE user_preferences
         SET
            application_job_statuses = COALESCE($2, application_job_statuses),
            application_show_notes = COALESCE($3, application_show_notes),
            application_show_archive = COALESCE($4, application_show_archive),
            application_enable_scroll = COALESCE($5, application_enable_scroll),
            application_view_mode = COALESCE($6, application_view_mode),
            archived_application_job_statuses = COALESCE($7, archived_application_job_statuses),
            archived_application_show_notes = COALESCE($8, archived_application_show_notes),
            archived_application_view_mode = COALESCE($9, archived_application_view_mode)
         WHERE user_id = $1
         RETURNING
            application_job_statuses,
            application_show_notes,
            application_show_archive,
            application_enable_scroll,
            application_view_mode,
            archived_application_job_statuses,
            archived_application_show_notes,
            archived_application_view_mode`,
        [
            userId,
            preferences.application_job_statuses,
            preferences.application_show_notes,
            preferences.application_show_archive,
            preferences.application_enable_scroll,
            preferences.application_view_mode,
            preferences.archived_application_job_statuses,
            preferences.archived_application_show_notes,
            preferences.archived_application_view_mode,
        ]
    );

    return result.rows[0];
};
