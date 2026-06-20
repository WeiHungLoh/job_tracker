import type {
    CreateInterviewRequest,
    CreateInterviewResponse,
    EmptyResponse,
    InterviewIdParams,
    ListInterviewsResponse,
} from './models.js';
import type { Request, Response } from 'express';
import {
    deleteAllJobInterviews,
    deleteJobInterview,
    getInterviews,
    insertInterview,
} from '../../db/queries/interviews.js';
import { handleRouteError, sendError } from '../../http/responses.js';
import { isNonEmptyString, isPositiveInteger, isString, isValidDate } from '../../http/validation.js';
import express from 'express';

const router = express.Router();

router.post(
    '/',
    async (
        req: Request<Record<string, never>, CreateInterviewResponse, CreateInterviewRequest>,
        res: Response<CreateInterviewResponse>
    ): Promise<void> => {
        const { jobId, interviewDate, interviewLocation, interviewType, notes } = req.body;

        if (
            !Number.isInteger(jobId) ||
            jobId <= 0 ||
            !isValidDate(interviewDate) ||
            !isNonEmptyString(interviewLocation) ||
            !isString(interviewType) ||
            !isString(notes)
        ) {
            sendError(res, 422, 'A valid job application, interview date, and interview location are required.');
            return;
        }

        try {
            if (!(await insertInterview(jobId, req.user.id, interviewDate, interviewLocation, interviewType, notes))) {
                sendError(res, 404, 'Job application not found.');
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
        if (!isPositiveInteger(req.params.interviewId)) {
            sendError(res, 422, 'Interview ID must be a positive integer.');
            return;
        }

        try {
            if (!(await deleteJobInterview(req.params.interviewId, req.user.id))) {
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
