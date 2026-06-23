import type {
    GetUserPreferencesResponse,
    UpdateUserPreferencesRequest,
    UpdateUserPreferencesResponse,
} from './models.js';
import type { Request, Response } from 'express';
import { getUserPreferences, updateUserPreferences } from '../../db/queries/userPreferences.js';
import { handleRouteError, sendError } from '../../http/responses.js';
import { isJobStatusFilter, isOptionalBoolean } from '../../http/validation.js';
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
            application_job_status,
            application_show_notes,
            application_show_archive,
            application_enable_scroll,
            archived_application_job_status,
            archived_application_show_notes,
        } = req.body;

        if (application_job_status !== undefined && !isJobStatusFilter(application_job_status)) {
            sendError(res, 422, 'Application job status preference must be Show All or a supported job status.');
            return;
        }
        if (archived_application_job_status !== undefined && !isJobStatusFilter(archived_application_job_status)) {
            sendError(
                res,
                422,
                'Archived application job status preference must be Show All or a supported job status.'
            );
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
