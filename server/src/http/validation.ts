import { JOB_STATUSES, type JobStatus } from '../db/models.js';

const HOSTNAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/i;
const ISO_DATE_PATTERN =
    /^(\d{4,})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

const isLeapYear = (year: number): boolean => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const hasValidCalendarDate = (value: string): boolean => {
    const match = ISO_DATE_PATTERN.exec(value);
    if (!match) {
        return false;
    }

    const [, yearValue, monthValue, dayValue, hourValue = '0', minuteValue = '0', secondValue = '0'] = match;
    const year = Number(yearValue);
    const month = Number(monthValue);
    const day = Number(dayValue);
    const hour = Number(hourValue);
    const minute = Number(minuteValue);
    const second = Number(secondValue);
    if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) {
        return false;
    }

    const daysInMonth = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
    return day >= 1 && day <= daysInMonth;
};

export const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

export const isString = (value: unknown): value is string => typeof value === 'string';

export const toTrimmedString = (value: unknown, maxLength: number, allowEmpty = false): string | undefined => {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmedValue = value.trim();
    if ((!allowEmpty && !trimmedValue) || trimmedValue.length > maxLength) {
        return undefined;
    }

    return trimmedValue;
};

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

export const isValidDate = (value: unknown): value is string => {
    if (typeof value !== 'string') {
        return false;
    }

    const trimmedValue = value.trim();
    return hasValidCalendarDate(trimmedValue) && !Number.isNaN(Date.parse(trimmedValue));
};

export const isFutureDate = (value: string): boolean => Date.parse(value) > Date.now();

export const isValidHttpURL = (value: string): boolean => {
    try {
        const parsedURL = new URL(value);
        return (
            (parsedURL.protocol === 'http:' || parsedURL.protocol === 'https:') &&
            HOSTNAME_PATTERN.test(parsedURL.hostname)
        );
    } catch {
        return false;
    }
};

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
