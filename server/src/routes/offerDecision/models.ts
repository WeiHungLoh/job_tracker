import type { OfferDecisionWorkspace, OfferEvaluationInput } from '../../db/models.js';
import type { EmptyResponse, ErrorResponse } from '../../http/models.js';

export type SaveOfferEvaluationRequest = OfferEvaluationInput;

export type GetOfferDecisionsQuery = {
    filters?: string | string[];
};

export type GetOfferDecisionsResponse = OfferDecisionWorkspace | ErrorResponse;
export type SaveOfferEvaluationResponse = EmptyResponse | ErrorResponse;
export type DeleteOfferEvaluationResponse = EmptyResponse | ErrorResponse;
export type DeleteAllOfferEvaluationsResponse = EmptyResponse | ErrorResponse;
