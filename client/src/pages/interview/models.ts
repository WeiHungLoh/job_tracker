import type { EntityId } from '../jobApplication/models';

export type JobInterview = {
    interview_id: EntityId;
    job_id: EntityId;
    company_name: string;
    job_title: string;
    interview_date: string;
    interview_location: string;
    interview_type: string;
    interview_notes: string;
    notes?: string;
};

export type ListInterviewsRequest = null;
export type ListInterviewsResponse = JobInterview[];

export type CreateInterviewRequest = {
    jobId: EntityId;
    interviewDate: Date;
    interviewLocation: string;
    interviewType: string;
    notes: string;
};
export type CreateInterviewResponse = string;

export type DeleteInterviewRequest = {
    interviewId: EntityId;
};
export type DeleteInterviewResponse = null;

export type DeleteAllInterviewsRequest = null;
export type DeleteAllInterviewsResponse = null;
