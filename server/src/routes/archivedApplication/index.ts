import type {
    ArchiveApplicationRequest,
    ArchiveApplicationResponse,
    ArchivedJobIdParams,
    EmptyResponse,
    ListArchivedApplicationsResponse,
} from './models.js';
import type { Request, Response } from 'express';
import {
    archiveJobApplication,
    deleteAllArchivedJobApplications,
    deleteArchivedJobApplication,
    getArchivedJobApplications,
    unarchiveJobApplication,
} from '../../db/queries/archivedJobApplications.js';
import { handleRouteError, sendError } from '../../http/responses.js';
import express from 'express';
import { isPositiveInteger } from '../../http/validation.js';

const router = express.Router();

router.post(
    '/',
    async (
        req: Request<Record<string, never>, ArchiveApplicationResponse, ArchiveApplicationRequest>,
        res: Response<ArchiveApplicationResponse>
    ): Promise<void> => {
        if (!Number.isInteger(req.body.jobId) || req.body.jobId <= 0) {
            sendError(res, 422, 'Job application ID must be a positive integer.');
            return;
        }

        try {
            if (!(await archiveJobApplication(req.body.jobId, req.user.id))) {
                sendError(res, 404, 'Job application not found.');
                return;
            }
            res.status(201).send('Successfully archived!');
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to archive the job application.');
        }
    }
);

router.get(
    '/',
    async (
        req: Request<Record<string, never>, ListArchivedApplicationsResponse>,
        res: Response<ListArchivedApplicationsResponse>
    ): Promise<void> => {
        try {
            res.status(200).json(await getArchivedJobApplications(req.user.id));
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to load archived job applications.');
        }
    }
);

router.delete(
    '/',
    async (req: Request<Record<string, never>, EmptyResponse>, res: Response<EmptyResponse>): Promise<void> => {
        try {
            await deleteAllArchivedJobApplications(req.user.id);
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to delete archived job applications.');
        }
    }
);

router.delete(
    '/:archivedJobId',
    async (req: Request<ArchivedJobIdParams, EmptyResponse>, res: Response<EmptyResponse>): Promise<void> => {
        if (!isPositiveInteger(req.params.archivedJobId)) {
            sendError(res, 422, 'Archived job application ID must be a positive integer.');
            return;
        }

        try {
            if (!(await deleteArchivedJobApplication(req.params.archivedJobId, req.user.id))) {
                sendError(res, 404, 'Archived job application not found.');
                return;
            }
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to delete the archived job application.');
        }
    }
);

router.post(
    '/:archivedJobId/restore',
    async (
        req: Request<ArchivedJobIdParams, ArchiveApplicationResponse>,
        res: Response<ArchiveApplicationResponse>
    ): Promise<void> => {
        if (!isPositiveInteger(req.params.archivedJobId)) {
            sendError(res, 422, 'Archived job application ID must be a positive integer.');
            return;
        }

        try {
            if (!(await unarchiveJobApplication(req.params.archivedJobId, req.user.id))) {
                sendError(res, 404, 'Archived job application not found.');
                return;
            }
            res.status(201).send('Successfully unarchived!');
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to unarchive the job application.');
        }
    }
);

export default router;
