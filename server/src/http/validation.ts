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

export const isPositiveInteger = (value: string): boolean => {
    const parsedValue = Number(value);
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
