import type {
    DeleteOfferEvaluationResponse,
    GetOfferDecisionsResponse,
    SaveOfferEvaluationRequest,
    SaveOfferEvaluationResponse,
} from './models.js';
import type { Request, Response } from 'express';
import {
    deleteOfferEvaluation,
    getOfferDecisionWorkspace,
    saveOfferEvaluation,
} from '../../db/queries/offerDecisions.js';
import { handleRouteError, sendError } from '../../http/responses.js';
import { isSaveOfferEvaluationRequest, toPositiveInteger } from '../../http/validation.js';
import express from 'express';

const router = express.Router();

router.get(
    '/',
    async (
        req: Request<Record<string, never>, GetOfferDecisionsResponse>,
        res: Response<GetOfferDecisionsResponse>
    ): Promise<void> => {
        try {
            res.status(200).json(await getOfferDecisionWorkspace(req.user.id, false));
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to load offer comparisons.');
        }
    }
);

router.get(
    '/archived',
    async (
        req: Request<Record<string, never>, GetOfferDecisionsResponse>,
        res: Response<GetOfferDecisionsResponse>
    ): Promise<void> => {
        try {
            res.status(200).json(await getOfferDecisionWorkspace(req.user.id, true));
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to load archived offer comparisons.');
        }
    }
);

router.put(
    '/:jobId',
    async (
        req: Request<{ jobId: string }, SaveOfferEvaluationResponse, SaveOfferEvaluationRequest>,
        res: Response<SaveOfferEvaluationResponse>
    ): Promise<void> => {
        const jobId = toPositiveInteger(req.params.jobId);
        if (jobId === undefined) {
            sendError(res, 422, 'Application ID is invalid.');
            return;
        }
        if (!isSaveOfferEvaluationRequest(req.body)) {
            sendError(res, 422, 'Offer evaluation fields are missing or invalid.');
            return;
        }

        try {
            const result = await saveOfferEvaluation(req.user.id, jobId, req.body);
            if (result === 'application_unavailable') {
                sendError(res, 409, 'Only active applications with Offer status can be saved.');
                return;
            }
            if (result === 'deadline_before_application') {
                sendError(res, 422, 'Decision deadline cannot be earlier than the application date.');
                return;
            }

            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to save offer evaluation.');
        }
    }
);

router.delete(
    '/:jobId',
    async (
        req: Request<{ jobId: string }, DeleteOfferEvaluationResponse>,
        res: Response<DeleteOfferEvaluationResponse>
    ): Promise<void> => {
        const jobId = toPositiveInteger(req.params.jobId);
        if (jobId === undefined) {
            sendError(res, 422, 'Application ID is invalid.');
            return;
        }

        try {
            if (!(await deleteOfferEvaluation(req.user.id, jobId))) {
                sendError(res, 404, 'Offer evaluation was not found.');
                return;
            }

            res.sendStatus(204);
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to delete offer evaluation.');
        }
    }
);

export default router;
