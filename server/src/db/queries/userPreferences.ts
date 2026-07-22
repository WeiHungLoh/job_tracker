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
            application_list_sort_order,
            application_board_sort_order,
            archived_application_job_statuses,
            archived_application_show_notes,
            archived_application_view_mode,
            archived_application_list_sort_order,
            archived_application_board_sort_order,
            interview_view_mode,
            archived_interview_view_mode,
            interview_time_filters,
            archived_interview_time_filters,
            offer_decision_filters,
            archived_offer_decision_filters
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
            application_list_sort_order = COALESCE($7, application_list_sort_order),
            application_board_sort_order = COALESCE($8, application_board_sort_order),
            archived_application_job_statuses = COALESCE($9, archived_application_job_statuses),
            archived_application_show_notes = COALESCE($10, archived_application_show_notes),
            archived_application_view_mode = COALESCE($11, archived_application_view_mode),
            archived_application_list_sort_order = COALESCE($12, archived_application_list_sort_order),
            archived_application_board_sort_order = COALESCE($13, archived_application_board_sort_order),
            interview_view_mode = COALESCE($14, interview_view_mode),
            archived_interview_view_mode = COALESCE($15, archived_interview_view_mode),
            interview_time_filters = COALESCE($16, interview_time_filters),
            archived_interview_time_filters = COALESCE($17, archived_interview_time_filters),
            offer_decision_filters = COALESCE($18, offer_decision_filters),
            archived_offer_decision_filters = COALESCE($19, archived_offer_decision_filters)
         WHERE user_id = $1
         RETURNING
            application_job_statuses,
            application_show_notes,
            application_show_archive,
            application_enable_scroll,
            application_view_mode,
            application_list_sort_order,
            application_board_sort_order,
            archived_application_job_statuses,
            archived_application_show_notes,
            archived_application_view_mode,
            archived_application_list_sort_order,
            archived_application_board_sort_order,
            interview_view_mode,
            archived_interview_view_mode,
            interview_time_filters,
            archived_interview_time_filters,
            offer_decision_filters,
            archived_offer_decision_filters`,
        [
            userId,
            preferences.application_job_statuses,
            preferences.application_show_notes,
            preferences.application_show_archive,
            preferences.application_enable_scroll,
            preferences.application_view_mode,
            preferences.application_list_sort_order,
            preferences.application_board_sort_order,
            preferences.archived_application_job_statuses,
            preferences.archived_application_show_notes,
            preferences.archived_application_view_mode,
            preferences.archived_application_list_sort_order,
            preferences.archived_application_board_sort_order,
            preferences.interview_view_mode,
            preferences.archived_interview_view_mode,
            preferences.interview_time_filters,
            preferences.archived_interview_time_filters,
            preferences.offer_decision_filters,
            preferences.archived_offer_decision_filters,
        ]
    );

    return result.rows[0];
};
