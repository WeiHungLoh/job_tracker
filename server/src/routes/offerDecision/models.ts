import type { OfferDecisionValues, OfferDecisionWorkspace, OfferDetails } from '../../db/models.js';
import type { EmptyResponse, ErrorResponse } from '../../http/models.js';

export type SaveOfferEvaluationRequest = {
    ratings: OfferDecisionValues;
    details: OfferDetails;
};

export type GetOfferDecisionsResponse = OfferDecisionWorkspace | ErrorResponse;
export type SaveOfferEvaluationResponse = EmptyResponse | ErrorResponse;
export type DeleteOfferEvaluationResponse = EmptyResponse | ErrorResponse;
