import type { JobStatus } from '../application/models';
import type { JobInterview } from '../interview/models';
import { getUpcomingInterviews as getUpcomingInterviewsByTiming } from '../../helper/interviewTiming';
import type { JobStatusCount } from './models';

export type StatusCountMap = Partial<Record<JobStatus, number>>;

export const getStatusCountMap = (statusCounts: JobStatusCount[]): StatusCountMap => {
    const countByStatus: StatusCountMap = {};

    statusCounts.forEach(({ job_status, count }) => {
        const numericCount = Number(count);
        countByStatus[job_status] = Number.isFinite(numericCount) ? numericCount : 0;
    });

    return countByStatus;
};

export const getTotalStatusCount = (countByStatus: StatusCountMap): number => {
    return Object.values(countByStatus).reduce((total, count) => total + count, 0);
};

export const getUpcomingInterviews = (interviews: JobInterview[], now = new Date()): JobInterview[] => {
    return getUpcomingInterviewsByTiming(interviews, now);
};
