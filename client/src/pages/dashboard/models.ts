import type { JobStatus } from '../jobApplication/models';

export type WeeklyApplicationCount = {
    start_of_week: string;
    applications_count: string;
};

export type JobStatusCount = {
    job_status: JobStatus;
    count: string;
};
