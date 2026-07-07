import type { JobStatus } from '../models';
import { JOB_STATUSES, JOB_STATUS_SORT_ORDER } from '../models';

type StatusApplication = {
    job_status: JobStatus;
};

export const isJobStatus = (value: string): value is JobStatus => {
    return JOB_STATUSES.includes(value as JobStatus);
};

export const groupApplicationsByStatus = <TApplication extends StatusApplication>(
    applications: readonly TApplication[]
): Record<JobStatus, TApplication[]> => {
    const groupedApplications = JOB_STATUSES.reduce(
        (groups, status) => ({ ...groups, [status]: [] }),
        {} as Record<JobStatus, TApplication[]>
    );

    applications.forEach((application) => {
        groupedApplications[application.job_status].push(application);
    });

    return groupedApplications;
};

export const getOrderedBoardStatuses = (selectedJobStatuses: readonly JobStatus[]): JobStatus[] => {
    return JOB_STATUS_SORT_ORDER.filter((status) => selectedJobStatuses.includes(status));
};
