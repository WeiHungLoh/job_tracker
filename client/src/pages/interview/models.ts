import type { JobStatus } from '../jobApplication/models';

export type JobInterview = {
    interview_id: number;
    job_id: number;
    company_name: string;
    job_title: string;
    job_status: JobStatus;
    interview_date: string;
    interview_location: string;
    interview_type: string;
    interview_notes: string;
};

export type ListInterviewsRequest = null;
export type ListInterviewsResponse = JobInterview[];

export type CreateInterviewRequest = {
    jobId: number;
    interviewDate: Date;
    interviewLocation: string;
    interviewType: string;
    notes: string;
};
export type CreateInterviewResponse = string;

export type DeleteInterviewRequest = {
    interviewId: number;
};
export type DeleteInterviewResponse = null;

export type DeleteAllInterviewsRequest = null;
export type DeleteAllInterviewsResponse = null;
