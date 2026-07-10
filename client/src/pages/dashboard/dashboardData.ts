import type { JobStatus } from '../application/models';
import type { JobInterview } from '../interview/models';
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
    const nowTime = now.getTime();

    return interviews
        .filter((interview) => new Date(interview.interview_date).getTime() > nowTime)
        .sort(
            (firstInterview, secondInterview) =>
                new Date(firstInterview.interview_date).getTime() - new Date(secondInterview.interview_date).getTime()
        );
};
