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
            archived_application_job_statuses,
            archived_application_show_notes
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
            archived_application_job_statuses = COALESCE($6, archived_application_job_statuses),
            archived_application_show_notes = COALESCE($7, archived_application_show_notes)
         WHERE user_id = $1
         RETURNING
            application_job_statuses,
            application_show_notes,
            application_show_archive,
            application_enable_scroll,
            archived_application_job_statuses,
            archived_application_show_notes`,
        [
            userId,
            preferences.application_job_statuses,
            preferences.application_show_notes,
            preferences.application_show_archive,
            preferences.application_enable_scroll,
            preferences.archived_application_job_statuses,
            preferences.archived_application_show_notes,
        ]
    );

    return result.rows[0];
};
