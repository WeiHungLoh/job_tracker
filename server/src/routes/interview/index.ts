import type {
    CreateInterviewRequest,
    CreateInterviewResponse,
    EmptyResponse,
    InterviewIdParams,
    ListInterviewsResponse,
} from './models.js';
import type { Request, Response } from 'express';
import { FIELD_MAX_LENGTHS } from '../../config/validation.js';
import {
    deleteAllJobInterviews,
    deleteJobInterview,
    getInterviews,
    insertInterview,
} from '../../db/queries/interviews.js';
import { handleRouteError, sendError } from '../../http/responses.js';
import { isValidDate, toPositiveInteger, toTrimmedString } from '../../http/validation.js';
import express from 'express';

const router = express.Router();

router.post(
    '/',
    async (
        req: Request<Record<string, never>, CreateInterviewResponse, CreateInterviewRequest>,
        res: Response<CreateInterviewResponse>
    ): Promise<void> => {
        const applicationId = toPositiveInteger(req.body.jobId);
        const interviewLocation = toTrimmedString(req.body.interviewLocation, FIELD_MAX_LENGTHS.location);
        const interviewType = toTrimmedString(req.body.interviewType, FIELD_MAX_LENGTHS.interviewType, true);
        const notes = toTrimmedString(req.body.notes, FIELD_MAX_LENGTHS.notes, true);
        const { interviewDate } = req.body;

        if (
            applicationId === undefined ||
            !isValidDate(interviewDate) ||
            interviewLocation === undefined ||
            interviewType === undefined ||
            notes === undefined
        ) {
            sendError(res, 422, 'Interview fields are missing, invalid, or too long.');
            return;
        }

        try {
            const insertResult = await insertInterview(
                applicationId,
                req.user.id,
                new Date(interviewDate).toISOString(),
                interviewLocation,
                interviewType,
                notes
            );
            if (insertResult === 'not-found') {
                sendError(res, 404, 'Job application not found.');
                return;
            }
            if (insertResult === 'invalid-date') {
                sendError(res, 422, 'Interview date must be after the job application date.');
                return;
            }
            res.status(201).send('Successfully added an interview!');
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to create the interview.');
        }
    }
);

router.get(
    '/',
    async (
        req: Request<Record<string, never>, ListInterviewsResponse>,
        res: Response<ListInterviewsResponse>
    ): Promise<void> => {
        try {
            res.status(200).json(await getInterviews(req.user.id));
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to load interviews.');
        }
    }
);

router.delete(
    '/',
    async (req: Request<Record<string, never>, EmptyResponse>, res: Response<EmptyResponse>): Promise<void> => {
        try {
            await deleteAllJobInterviews(req.user.id);
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to delete interviews.');
        }
    }
);

router.delete(
    '/:interviewId',
    async (req: Request<InterviewIdParams, EmptyResponse>, res: Response<EmptyResponse>): Promise<void> => {
        const interviewId = toPositiveInteger(req.params.interviewId);
        if (interviewId === undefined) {
            sendError(res, 422, 'Interview ID must be a positive integer.');
            return;
        }

        try {
            const interviewDeleted = await deleteJobInterview(interviewId, req.user.id);
            if (!interviewDeleted) {
                sendError(res, 404, 'Interview not found.');
                return;
            }
            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to delete the interview.');
        }
    }
);

export default router;
