import type { JobStatus, JobStatusFilter } from '../db/models.js';

const JOB_STATUSES: readonly string[] = [
    'Accepted',
    'Applied',
    'Declined',
    'Ghosted',
    'Interview',
    'Offer',
    'Rejected',
];

export const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

export const isString = (value: unknown): value is string => typeof value === 'string';

export const isPositiveInteger = (value: unknown): boolean => {
    if (typeof value !== 'number' && typeof value !== 'string') {
        return false;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
        return false;
    }

    const parsedValue = typeof value === 'number' ? value : Number(value);
    return Number.isInteger(parsedValue) && parsedValue > 0;
};

export const isValidDate = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Date.parse(value));

export const isValidEmail = (value: unknown): value is string =>
    typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isJobStatus = (value: unknown): value is JobStatus =>
    typeof value === 'string' && JOB_STATUSES.includes(value);

export const isJobStatusFilter = (value: unknown): value is JobStatusFilter =>
    value === 'Show All' || isJobStatus(value);

export const toJobStatusQueryValue = (value: unknown): JobStatus | null | undefined => {
    const requestedStatus = value ?? 'Show All';

    if (!isJobStatusFilter(requestedStatus)) {
        return undefined;
    }

    return requestedStatus === 'Show All' ? null : requestedStatus;
};

export const isOptionalBoolean = (value: unknown): value is boolean | undefined =>
    value === undefined || typeof value === 'boolean';
