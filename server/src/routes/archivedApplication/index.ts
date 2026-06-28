import type {
    ArchiveApplicationRequest,
    ArchivedJobIdParams,
    EmptyResponse,
    ListArchivedApplicationsQuery,
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
import { toJobStatusQueryValues, toPositiveInteger } from '../../http/validation.js';

const router = express.Router();

router.patch(
    '/',
    async (
        req: Request<Record<string, never>, EmptyResponse, ArchiveApplicationRequest>,
        res: Response<EmptyResponse>
    ): Promise<void> => {
        const jobId = toPositiveInteger(req.body.jobId);
        if (jobId === undefined) {
            sendError(res, 422, 'Job application ID must be a positive integer.');
            return;
        }

        try {
            const applicationArchived = await archiveJobApplication(jobId, req.user.id);
            if (!applicationArchived) {
                sendError(res, 404, 'Job application not found.');
                return;
            }
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to archive the job application.');
        }
    }
);

router.get(
    '/',
    async (
        req: Request<
            Record<string, never>,
            ListArchivedApplicationsResponse,
            Record<string, never>,
            ListArchivedApplicationsQuery
        >,
        res: Response<ListArchivedApplicationsResponse>
    ): Promise<void> => {
        const jobStatuses = toJobStatusQueryValues(req.query.jobStatuses);
        if (jobStatuses === undefined) {
            sendError(res, 422, 'Each job status filter must be supported.');
            return;
        }

        try {
            res.status(200).json(await getArchivedJobApplications(req.user.id, jobStatuses));
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
        const archivedJobId = toPositiveInteger(req.params.archivedJobId);
        if (archivedJobId === undefined) {
            sendError(res, 422, 'Archived job application ID must be a positive integer.');
            return;
        }

        try {
            const applicationDeleted = await deleteArchivedJobApplication(archivedJobId, req.user.id);
            if (!applicationDeleted) {
                sendError(res, 404, 'Archived job application not found.');
                return;
            }
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to delete the archived job application.');
        }
    }
);

router.patch(
    '/:archivedJobId/restore',
    async (req: Request<ArchivedJobIdParams, EmptyResponse>, res: Response<EmptyResponse>): Promise<void> => {
        const archivedJobId = toPositiveInteger(req.params.archivedJobId);
        if (archivedJobId === undefined) {
            sendError(res, 422, 'Archived job application ID must be a positive integer.');
            return;
        }

        try {
            const applicationUnarchived = await unarchiveJobApplication(archivedJobId, req.user.id);
            if (!applicationUnarchived) {
                sendError(res, 404, 'Archived job application not found.');
                return;
            }
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to unarchive the job application.');
        }
    }
);

export default router;
