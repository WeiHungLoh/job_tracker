import type {
    CreateApplicationRequest,
    CreateApplicationResponse,
    EmptyResponse,
    JobIdParams,
    ListApplicationsQuery,
    ListApplicationsResponse,
    ListJobStatusCountsResponse,
    ListWeeklyApplicationsResponse,
    UpdateEditStatusRequest,
    UpdateJobStatusRequest,
    UpdateNotesRequest,
} from './models.js';
import type { Request, Response } from 'express';
import {
    deleteAllJobApplications,
    deleteJobApplication,
    editNotes,
    getApplicationsForLatestEightWeeks,
    getJobApplications,
    getJobStatusCounts,
    insertJobApplication,
    updateEditStatus,
    updateJobStatus,
} from '../../db/queries/jobApplications.js';
import { handleRouteError, sendError } from '../../http/responses.js';
import {
    isJobStatus,
    isNonEmptyString,
    isString,
    isValidDate,
    toPositiveInteger,
    toJobStatusQueryValues,
} from '../../http/validation.js';
import express from 'express';

const router = express.Router();

router.post(
    '/',
    async (
        req: Request<Record<string, never>, CreateApplicationResponse, CreateApplicationRequest>,
        res: Response<CreateApplicationResponse>
    ): Promise<void> => {
        const { companyName, jobTitle, appDate, jobStatus, jobLocation, jobURL } = req.body;

        if (
            !isNonEmptyString(companyName) ||
            !isNonEmptyString(jobTitle) ||
            !isValidDate(appDate) ||
            !isJobStatus(jobStatus) ||
            !isString(jobLocation) ||
            !isString(jobURL)
        ) {
            sendError(res, 422, 'Company name, job title, application date, and a supported job status are required.');
            return;
        }

        try {
            await insertJobApplication(req.user.id, companyName, jobTitle, appDate, jobStatus, jobLocation, jobURL);
            res.status(201).send('Successfully added a job application!');
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to create the job application.');
        }
    }
);

router.get(
    '/',
    async (
        req: Request<Record<string, never>, ListApplicationsResponse, Record<string, never>, ListApplicationsQuery>,
        res: Response<ListApplicationsResponse>
    ): Promise<void> => {
        const jobStatuses = toJobStatusQueryValues(req.query.jobStatuses);
        if (jobStatuses === undefined) {
            sendError(res, 422, 'Each job status filter must be supported.');
            return;
        }

        try {
            res.status(200).json(await getJobApplications(req.user.id, jobStatuses));
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to load job applications.');
        }
    }
);

router.get(
    '/status-counts',
    async (
        req: Request<Record<string, never>, ListJobStatusCountsResponse>,
        res: Response<ListJobStatusCountsResponse>
    ): Promise<void> => {
        try {
            res.status(200).json(await getJobStatusCounts(req.user.id));
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to load job application status counts.');
        }
    }
);

router.get(
    '/weekly-counts',
    async (
        req: Request<Record<string, never>, ListWeeklyApplicationsResponse>,
        res: Response<ListWeeklyApplicationsResponse>
    ): Promise<void> => {
        try {
            res.status(200).json(await getApplicationsForLatestEightWeeks(req.user.id));
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to load weekly job application counts.');
        }
    }
);

router.delete(
    '/',
    async (req: Request<Record<string, never>, EmptyResponse>, res: Response<EmptyResponse>): Promise<void> => {
        try {
            await deleteAllJobApplications(req.user.id);
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to delete job applications.');
        }
    }
);

router.delete(
    '/:jobId',
    async (req: Request<JobIdParams, EmptyResponse>, res: Response<EmptyResponse>): Promise<void> => {
        const jobId = toPositiveInteger(req.params.jobId);
        if (jobId === undefined) {
            sendError(res, 422, 'Job application ID must be a positive integer.');
            return;
        }

        try {
            const applicationDeleted = await deleteJobApplication(jobId, req.user.id);
            if (!applicationDeleted) {
                sendError(res, 404, 'Job application not found.');
                return;
            }
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to delete the job application.');
        }
    }
);

router.patch(
    '/:jobId/notes',
    async (
        req: Request<JobIdParams, EmptyResponse, UpdateNotesRequest>,
        res: Response<EmptyResponse>
    ): Promise<void> => {
        const jobId = toPositiveInteger(req.params.jobId);
        if (jobId === undefined) {
            sendError(res, 422, 'Job application ID must be a positive integer.');
            return;
        }
        if (!isString(req.body.notes)) {
            sendError(res, 422, 'Notes must be a string.');
            return;
        }

        try {
            const notesUpdated = await editNotes(jobId, req.user.id, req.body.notes);
            if (!notesUpdated) {
                sendError(res, 404, 'Job application not found.');
                return;
            }
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to update job application notes.');
        }
    }
);

router.patch(
    '/:jobId/edit-status',
    async (
        req: Request<JobIdParams, EmptyResponse, UpdateEditStatusRequest>,
        res: Response<EmptyResponse>
    ): Promise<void> => {
        const jobId = toPositiveInteger(req.params.jobId);
        if (jobId === undefined) {
            sendError(res, 422, 'Job application ID must be a positive integer.');
            return;
        }
        if (typeof req.body.editStatus !== 'boolean') {
            sendError(res, 422, 'Edit status must be a boolean.');
            return;
        }

        try {
            const editStatusUpdated = await updateEditStatus(req.body.editStatus, jobId, req.user.id);
            if (!editStatusUpdated) {
                sendError(res, 404, 'Job application not found.');
                return;
            }
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to change the job application edit status.');
        }
    }
);

router.patch(
    '/:jobId/status',
    async (
        req: Request<JobIdParams, EmptyResponse, UpdateJobStatusRequest>,
        res: Response<EmptyResponse>
    ): Promise<void> => {
        const jobId = toPositiveInteger(req.params.jobId);
        if (jobId === undefined) {
            sendError(res, 422, 'Job application ID must be a positive integer.');
            return;
        }
        if (!isJobStatus(req.body.jobStatus)) {
            sendError(res, 422, 'A supported job status is required.');
            return;
        }

        try {
            const jobStatusUpdated = await updateJobStatus(req.body.jobStatus, jobId, req.user.id);
            if (!jobStatusUpdated) {
                sendError(res, 404, 'Job application not found.');
                return;
            }
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to change the job application status.');
        }
    }
);

export default router;
