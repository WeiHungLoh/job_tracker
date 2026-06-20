import type { ErrorResponse } from '../../http/models.js';
import type { JobInterview } from '../../db/models.js';

export type InterviewIdParams = {
    interviewId: string;
};

export type CreateInterviewRequest = {
    jobId: number;
    interviewDate: string;
    interviewLocation: string;
    interviewType: string;
    notes: string;
};

export type CreateInterviewResponse = string | ErrorResponse;
export type ListInterviewsResponse = JobInterview[] | ErrorResponse;
export type EmptyResponse = undefined | ErrorResponse;
