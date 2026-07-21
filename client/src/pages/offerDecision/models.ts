import type { JobStatus } from '../application/models';

export type OfferDecisionCategory = 'career_growth' | 'company_culture_fit' | 'work_life_balance' | 'compensation';

export type OfferDecisionRating = 1 | 2 | 3 | 4 | 5;

export type OfferDecisionCategoryConfig = {
    key: OfferDecisionCategory;
    label: string;
};

export type OfferDecisionValues = {
    career_growth: OfferDecisionRating;
    company_culture_fit: OfferDecisionRating;
    work_life_balance: OfferDecisionRating;
    compensation: OfferDecisionRating;
};

export type OfferWorkArrangement = '' | 'Remote' | 'Hybrid' | 'On-site' | 'Flexible';

export type OfferDetails = {
    currency: string;
    monthly_base_salary: number | null;
    bonus: string;
    annual_leave_days: number | null;
    work_arrangement: OfferWorkArrangement;
    decision_deadline: string;
    pros: string;
    concerns: string;
};

export type OfferEvaluation = {
    job_id: number;
    ratings: OfferDecisionValues;
    details: OfferDetails;
    updated_at: string;
};

export type OfferDecisionApplication = {
    job_id: number;
    company_name: string;
    job_title: string;
    job_status: JobStatus;
    application_date: string;
    evaluation: OfferEvaluation | null;
};

export type OfferDecisionWorkspaceData = {
    applications: OfferDecisionApplication[];
};

export type SaveOfferEvaluationRequest = {
    ratings: OfferDecisionValues;
    details: OfferDetails;
};

export type SaveOfferEvaluationAPIRequest = SaveOfferEvaluationRequest & {
    jobId: number;
};

export type OfferEvaluationFormErrors = {
    ratings?: string;
    currency?: string;
    monthly_base_salary?: string;
    bonus?: string;
    annual_leave_days?: string;
    work_arrangement?: string;
    decision_deadline?: string;
    pros?: string;
    concerns?: string;
};

export type ValidOfferEvaluation = {
    isValid: true;
    values: SaveOfferEvaluationRequest;
};

export type InvalidOfferEvaluation = {
    isValid: false;
    errors: OfferEvaluationFormErrors;
};

export type OfferEvaluationValidationResult = ValidOfferEvaluation | InvalidOfferEvaluation;

export type GetOfferDecisionsRequest = null;
export type GetOfferDecisionsResponse = OfferDecisionWorkspaceData;
export type SaveOfferEvaluationResponse = null;
export type DeleteOfferEvaluationRequest = { jobId: number };
export type DeleteOfferEvaluationResponse = null;

export type OfferDecisionWorkspaceProps = {
    data: OfferDecisionWorkspaceData;
    onDelete?: (jobId: number) => Promise<void>;
    onSave?: (jobId: number, request: SaveOfferEvaluationRequest) => Promise<void>;
    readOnly: boolean;
};
