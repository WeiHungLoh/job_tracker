import type { JobApplication, JobStatus, JobStatusCount, WeeklyApplicationCount } from '../application/models';
import type { JobInterview } from '../interview/models';

export type DashboardInterviewSelectHandler = (interviewId: number) => void;
export type DashboardStatusSelectHandler = (status: JobStatus) => void;
export type StatusCountMap = Partial<Record<JobStatus, number>>;

export type DashboardDataProps = {
    statusCounts: JobStatusCount[];
    interviews: JobInterview[];
    weeklyApplications: WeeklyApplicationCount[];
    isLoading: boolean;
};

export type DashboardNavigationProps = {
    onInterviewSelect?: DashboardInterviewSelectHandler;
    onStatusSelect?: DashboardStatusSelectHandler;
};

export type DashboardContentProps = DashboardDataProps &
    DashboardNavigationProps & {
        applications: JobApplication[];
    };
export type DashboardStatsProps = DashboardDataProps & {
    currentTime?: Date;
};

export type ApplicationsLineChartProps = {
    interviews: JobInterview[];
    weeklyApplications: WeeklyApplicationCount[];
    isLoading: boolean;
};

export type StatusChartProps = {
    statusCounts: JobStatusCount[];
    isLoading: boolean;
    onStatusSelect?: DashboardStatusSelectHandler;
};

export type UpcomingInterviewsProps = {
    currentTime?: Date;
    interviews: JobInterview[];
    isLoading: boolean;
    onInterviewSelect?: DashboardInterviewSelectHandler;
};
