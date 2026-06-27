import { JOB_STATUSES, JOB_STATUS_FILTER_OPTIONS, type JobStatus, type JobStatusFilter } from '../db/models.js';

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

export const isJobStatusFilter = (value: unknown): value is JobStatusFilter =>
    typeof value === 'string' && JOB_STATUS_FILTER_OPTIONS.includes(value as JobStatusFilter);

export const toJobStatusQueryValue = (value: unknown): JobStatus | null | undefined => {
    const requestedStatus = value ?? 'Show All';

    if (!isJobStatusFilter(requestedStatus)) {
        return undefined;
    }

    return requestedStatus === 'Show All' ? null : requestedStatus;
};

export const isOptionalBoolean = (value: unknown): value is boolean | undefined =>
    value === undefined || typeof value === 'boolean';
