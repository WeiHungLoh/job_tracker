import type { ErrorResponse } from '../../http/models.js';
export type { EmptyResponse } from '../../http/models.js';
import type { InterviewCollectionSummary, JobInterview } from '../../db/models.js';

export type InterviewIdParams = {
    interviewId: string;
};

export type CreateInterviewRequest = {
    jobId: number;
    interviewDate: string;
    interviewDurationMinutes: number;
    interviewLocation: string;
    interviewType: string;
    notes: string;
};

export type CreateInterviewResponse = string | ErrorResponse;
export type ListInterviewsResponse = JobInterview[] | ErrorResponse;
export type GetInterviewCollectionSummaryResponse = InterviewCollectionSummary | ErrorResponse;
