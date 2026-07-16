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
    allowSchedulingConflict?: boolean;
};

export type InterviewSchedulingConflictCode = 'INTERVIEW_SCHEDULING_CONFLICT';

export type InterviewSchedulingConflict = {
    interview_id: number;
    job_id: number;
    company_name: string;
    job_title: string;
    interview_date: string;
    interview_duration_minutes: number;
    interview_type: string;
};

export type InterviewSchedulingConflictResponse = {
    code: InterviewSchedulingConflictCode;
    message: string;
    conflicts: InterviewSchedulingConflict[];
};

export type CreateInterviewResponse = string | InterviewSchedulingConflictResponse | ErrorResponse;
export type ListInterviewsResponse = JobInterview[] | ErrorResponse;
export type GetInterviewCollectionSummaryResponse = InterviewCollectionSummary | ErrorResponse;
