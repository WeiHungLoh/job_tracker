import { JOB_STATUSES, type JobStatus } from '../db/models.js';

export const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

export const isString = (value: unknown): value is string => typeof value === 'string';

export const toPositiveInteger = (value: unknown): number | undefined => {
    if (typeof value !== 'number' && typeof value !== 'string') {
        return undefined;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
        return undefined;
    }

    const parsedValue = typeof value === 'number' ? value : Number(value);
    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
};

export const isValidDate = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Date.parse(value));

export const isValidEmail = (value: unknown): value is string =>
    typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isJobStatus = (value: unknown): value is JobStatus =>
    typeof value === 'string' && JOB_STATUSES.includes(value as JobStatus);

export const isJobStatusArray = (value: unknown): value is JobStatus[] => {
    return Array.isArray(value) && value.every(isJobStatus);
};

export const toJobStatusQueryValues = (value: unknown): JobStatus[] | undefined => {
    if (value === undefined) {
        return [...JOB_STATUSES];
    }

    const requestedStatuses = Array.isArray(value) ? value : [value];
    if (requestedStatuses.length === 1 && requestedStatuses[0] === '') {
        return [...JOB_STATUSES];
    }

    const jobStatuses: JobStatus[] = [];
    for (const requestedStatus of requestedStatuses) {
        if (!isJobStatus(requestedStatus)) {
            return undefined;
        }
        if (!jobStatuses.includes(requestedStatus)) {
            jobStatuses.push(requestedStatus);
        }
    }

    return jobStatuses;
};

export const isOptionalBoolean = (value: unknown): value is boolean | undefined =>
    value === undefined || typeof value === 'boolean';
