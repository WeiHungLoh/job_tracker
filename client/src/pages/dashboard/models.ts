import type { JobStatus } from '../application/models';
import type { JobInterview } from '../interview/models';

export type WeeklyApplicationCount = {
    start_of_week: string;
    applications_count: string;
};

export type JobStatusCount = {
    job_status: JobStatus;
    count: string;
};

export type DashboardDataProps = {
    statusCounts: JobStatusCount[];
    interviews: JobInterview[];
    weeklyApplications: WeeklyApplicationCount[];
    isLoading: boolean;
};

export type DashboardContentProps = DashboardDataProps;
export type DashboardStatsProps = DashboardDataProps;

export type ApplicationsLineChartProps = {
    weeklyApplications: WeeklyApplicationCount[];
    isLoading: boolean;
};

export type StatusChartProps = {
    statusCounts: JobStatusCount[];
    isLoading: boolean;
};

export type UpcomingInterviewsProps = {
    interviews: JobInterview[];
    isLoading: boolean;
};
