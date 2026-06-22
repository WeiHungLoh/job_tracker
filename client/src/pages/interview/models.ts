export type JobInterview = {
    interview_id: number;
    job_id: number;
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
