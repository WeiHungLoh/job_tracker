import type { ArchivedInterviewIdParams, EmptyResponse, ListArchivedInterviewsResponse } from './models.js';
import type { Request, Response } from 'express';
import {
    deleteAllArchivedJobInterviews,
    deleteArchivedJobInterview,
    getArchivedJobInterviews,
} from '../../db/queries/archivedInterviews.js';
import { handleRouteError, sendError } from '../../http/responses.js';
import express from 'express';
import { isPositiveInteger } from '../../http/validation.js';

const router = express.Router();

router.get(
    '/',
    async (
        req: Request<Record<string, never>, ListArchivedInterviewsResponse>,
        res: Response<ListArchivedInterviewsResponse>
    ): Promise<void> => {
        try {
            res.status(200).json(await getArchivedJobInterviews(req.user.id));
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to load archived interviews.');
        }
    }
);

router.delete(
    '/',
    async (req: Request<Record<string, never>, EmptyResponse>, res: Response<EmptyResponse>): Promise<void> => {
        try {
            await deleteAllArchivedJobInterviews(req.user.id);
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to delete archived interviews.');
        }
    }
);

router.delete(
    '/:archivedInterviewId',
    async (req: Request<ArchivedInterviewIdParams, EmptyResponse>, res: Response<EmptyResponse>): Promise<void> => {
        if (!isPositiveInteger(req.params.archivedInterviewId)) {
            sendError(res, 422, 'Archived interview ID must be a positive integer.');
            return;
        }

        try {
            if (!(await deleteArchivedJobInterview(req.params.archivedInterviewId, req.user.id))) {
                sendError(res, 404, 'Archived interview not found.');
                return;
            }
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to delete the archived interview.');
        }
    }
);

export default router;
