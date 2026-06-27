import type { JobStatus } from '../jobApplication/models';

export type WeeklyApplicationCount = {
    start_of_week: string;
    applications_count: string;
};

export type JobStatusCount = {
    job_status: JobStatus;
    count: string;
};

export type DashboardStatsData = {
    total: number;
    activeInterviews: number;
    offers: number;
    responseRate: string;
    thisWeek: number;
};
