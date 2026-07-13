import type {
    GetUserPreferencesResponse,
    UpdateUserPreferencesRequest,
    UpdateUserPreferencesResponse,
} from './models.js';
import type { Request, Response } from 'express';
import { getUserPreferences, updateUserPreferences } from '../../db/queries/userPreferences.js';
import { handleRouteError, sendError } from '../../http/responses.js';
import {
    isJobStatusArray,
    isInterviewTimeFilterArray,
    isOptionalApplicationBoardSortOrder,
    isOptionalApplicationListSortOrder,
    isOptionalApplicationViewMode,
    isOptionalBoolean,
} from '../../http/validation.js';
import express from 'express';

const router = express.Router();

router.get(
    '/',
    async (
        req: Request<Record<string, never>, GetUserPreferencesResponse>,
        res: Response<GetUserPreferencesResponse>
    ): Promise<void> => {
        try {
            const preferences = await getUserPreferences(req.user.id);
            if (!preferences) {
                sendError(res, 404, 'User preferences not found.');
                return;
            }

            res.status(200).json(preferences);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to load user preferences.');
        }
    }
);

router.patch(
    '/',
    async (
        req: Request<Record<string, never>, UpdateUserPreferencesResponse, UpdateUserPreferencesRequest>,
        res: Response<UpdateUserPreferencesResponse>
    ): Promise<void> => {
        const {
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
        } = req.body;

        if (application_job_statuses !== undefined && !isJobStatusArray(application_job_statuses)) {
            sendError(res, 422, 'Application job status preferences must contain only supported job statuses.');
            return;
        }
        if (archived_application_job_statuses !== undefined && !isJobStatusArray(archived_application_job_statuses)) {
            sendError(
                res,
                422,
                'Archived application job status preferences must contain only supported job statuses.'
            );
            return;
        }
        if (interview_time_filters !== undefined && !isInterviewTimeFilterArray(interview_time_filters)) {
            sendError(res, 422, 'Interview time filter preferences must contain only supported values.');
            return;
        }
        if (
            archived_interview_time_filters !== undefined &&
            !isInterviewTimeFilterArray(archived_interview_time_filters)
        ) {
            sendError(res, 422, 'Archived interview time filter preferences must contain only supported values.');
            return;
        }
        if (
            !isOptionalApplicationViewMode(application_view_mode) ||
            !isOptionalApplicationViewMode(archived_application_view_mode) ||
            !isOptionalApplicationViewMode(interview_view_mode) ||
            !isOptionalApplicationViewMode(archived_interview_view_mode)
        ) {
            sendError(res, 422, 'View mode preferences must be list or board.');
            return;
        }
        if (!isOptionalApplicationListSortOrder(application_list_sort_order)) {
            sendError(res, 422, 'Application list sort order preference must use a supported value.');
            return;
        }
        if (!isOptionalApplicationBoardSortOrder(application_board_sort_order)) {
            sendError(res, 422, 'Application board sort order preference must use a supported value.');
            return;
        }
        if (!isOptionalApplicationListSortOrder(archived_application_list_sort_order)) {
            sendError(res, 422, 'Archived application list sort order preference must use a supported value.');
            return;
        }
        if (!isOptionalApplicationBoardSortOrder(archived_application_board_sort_order)) {
            sendError(res, 422, 'Archived application board sort order preference must use a supported value.');
            return;
        }
        if (
            !isOptionalBoolean(application_show_notes) ||
            !isOptionalBoolean(application_show_archive) ||
            !isOptionalBoolean(application_enable_scroll) ||
            !isOptionalBoolean(archived_application_show_notes)
        ) {
            sendError(res, 422, 'Show notes and show archive preferences must be boolean values.');
            return;
        }

        try {
            const preferences = await updateUserPreferences(req.user.id, req.body);
            if (!preferences) {
                sendError(res, 404, 'User preferences not found.');
                return;
            }

            res.status(200).json(preferences);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to update user preferences.');
        }
    }
);

export default router;
