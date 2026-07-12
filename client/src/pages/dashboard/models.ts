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

export type DashboardNavigationProps = {
    onInterviewSelect?: (interviewId: number) => void;
    onStatusSelect?: (status: JobStatus) => void;
};

export type DashboardContentProps = DashboardDataProps & DashboardNavigationProps;
export type DashboardStatsProps = DashboardDataProps;

export type ApplicationsLineChartProps = {
    weeklyApplications: WeeklyApplicationCount[];
    isLoading: boolean;
};

export type StatusChartProps = Pick<DashboardNavigationProps, 'onStatusSelect'> & {
    statusCounts: JobStatusCount[];
    isLoading: boolean;
};

export type UpcomingInterviewsProps = Pick<DashboardNavigationProps, 'onInterviewSelect'> & {
    interviews: JobInterview[];
    isLoading: boolean;
};
