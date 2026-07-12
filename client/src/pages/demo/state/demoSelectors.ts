import type { ArchivedJobApplication, JobApplication, JobStatus } from '../../application/models';
import { JOB_STATUSES, JOB_STATUS_ORDER } from '../../application/models';
import type { DemoState } from '../models';
import type { JobStatusCount, WeeklyApplicationCount } from '../../dashboard/models';
import { startOfLocalWeek, toDateString } from './demoDateHelpers';

type StatusApplication = {
    application_date: string;
    job_status: JobStatus;
};

type InterviewWithDate = {
    interview_date: string;
};

const sortApplications = <TApplication extends StatusApplication>(applications: TApplication[]): TApplication[] => {
    return [...applications].sort((firstApplication, secondApplication) => {
        const byStatus = JOB_STATUS_ORDER[firstApplication.job_status] - JOB_STATUS_ORDER[secondApplication.job_status];

        return (
            byStatus || Date.parse(secondApplication.application_date) - Date.parse(firstApplication.application_date)
        );
    });
};

export const sortInterviews = <Interview extends InterviewWithDate>(
    interviews: readonly Interview[],
    now = Date.now()
): Interview[] => {
    return [...interviews].sort((firstInterview, secondInterview) => {
        const firstTime = Date.parse(firstInterview.interview_date);
        const secondTime = Date.parse(secondInterview.interview_date);
        const firstIsFuture = firstTime > now;
        const secondIsFuture = secondTime > now;

        if (firstIsFuture !== secondIsFuture) {
            return firstIsFuture ? -1 : 1;
        }

        return firstTime - secondTime;
    });
};

export const selectApplications = (state: DemoState): JobApplication[] => {
    const selectedStatuses = state.preferences.application_job_statuses;

    return sortApplications(
        state.applications.filter((application) => selectedStatuses.includes(application.job_status))
    );
};

export const selectArchivedApplications = (state: DemoState): ArchivedJobApplication[] => {
    const selectedStatuses = state.preferences.archived_application_job_statuses;

    return sortApplications(
        state.archivedApplications.filter((application) => selectedStatuses.includes(application.job_status))
    );
};

export const selectApplicationById = (state: DemoState, jobId: number): JobApplication | undefined => {
    return state.applications.find((application) => application.job_id === jobId);
};

export const selectArchivedApplicationById = (
    state: DemoState,
    archivedJobId: number
): ArchivedJobApplication | undefined => {
    return state.archivedApplications.find((application) => application.archived_job_id === archivedJobId);
};

export const selectInterviewJobIdSet = (state: DemoState): Set<number> => {
    return new Set(state.interviews.map((interview) => interview.job_id));
};

export const selectUpcomingInterviewCountByJob = (state: DemoState, now = new Date()): Record<number, number> => {
    const counts: Record<number, number> = {};

    state.interviews.forEach((interview) => {
        if (new Date(interview.interview_date) > now) {
            counts[interview.job_id] = (counts[interview.job_id] || 0) + 1;
        }
    });

    return counts;
};

export const selectJobStatusCounts = (state: DemoState): JobStatusCount[] => {
    return JOB_STATUSES.map((jobStatus) => {
        const count = state.applications.filter((application) => application.job_status === jobStatus).length;
        return { job_status: jobStatus, count: String(count) };
    }).filter((statusCount) => Number(statusCount.count) > 0);
};

export const selectWeeklyApplications = (state: DemoState, now = new Date()): WeeklyApplicationCount[] => {
    const currentWeekStart = startOfLocalWeek(now);
    const weekStarts = Array.from({ length: 8 }, (_, index) => {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(currentWeekStart.getDate() - (7 - index) * 7);
        return weekStart;
    });

    return weekStarts.map((weekStart) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const count = state.applications.filter((application) => {
            const applicationDate = new Date(application.application_date);
            return applicationDate >= weekStart && applicationDate < weekEnd;
        }).length;

        return {
            start_of_week: toDateString(weekStart),
            applications_count: String(count),
        };
    });
};
