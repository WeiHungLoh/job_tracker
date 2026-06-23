import type { UpdateUserPreferencesRequest } from '../../routes/userPreferences/models.js';
import type { UserPreferences } from '../models.js';
import { pool } from '../connectDB.js';

const getUserPreferences = async (userId: number): Promise<UserPreferences | undefined> => {
    const res = await pool.query<UserPreferences>(`SELECT * FROM user_preferences WHERE user_id = $1`, [userId]);

    return res.rows[0];
};

const updateUserPreferences = async (
    userId: number,
    preferences: UpdateUserPreferencesRequest
): Promise<UserPreferences | undefined> => {
    const res = await pool.query<UserPreferences>(
        `UPDATE user_preferences
         SET
            application_job_status = COALESCE($2, application_job_status),
            application_show_notes = COALESCE($3, application_show_notes),
            application_show_archive = COALESCE($4, application_show_archive),
            application_enable_scroll = COALESCE($5, application_enable_scroll),
            archived_application_job_status = COALESCE($6, archived_application_job_status),
            archived_application_show_notes = COALESCE($7, archived_application_show_notes)
         WHERE user_id = $1
         RETURNING *`,
        [
            userId,
            preferences.application_job_status,
            preferences.application_show_notes,
            preferences.application_show_archive,
            preferences.application_enable_scroll,
            preferences.archived_application_job_status,
            preferences.archived_application_show_notes,
        ]
    );

    return res.rows[0];
};

export { getUserPreferences, updateUserPreferences };
