import type {
    ArchivedJobApplication,
    CreateApplicationRequest,
    DuplicateApplicationDetails,
    DuplicateApplicationErrorResponse,
    JobApplication,
} from './models';
import { JobTrackerAPIError } from '../../api/models';

type DuplicateApplicationAPIError = JobTrackerAPIError & {
    data: DuplicateApplicationErrorResponse;
};

type PotentialDuplicate = DuplicateApplicationDetails & {
    id: number;
    isArchived: boolean;
    isUrlMatch: boolean;
    timestamp: number;
};

const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object';

const hasParseableApplicationDate = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Date.parse(value));

export const normalizeDuplicateApplicationText = (value: string): string =>
    value.trim().toLowerCase().replace(/\s+/g, ' ');

export const isDuplicateApplicationError = (error: unknown): error is DuplicateApplicationAPIError => {
    if (!(error instanceof JobTrackerAPIError) || error.status !== 409 || !isObject(error.data)) {
        return false;
    }

    const duplicate = error.data.duplicate;
    return (
        error.data.code === 'POSSIBLE_DUPLICATE_APPLICATION' &&
        typeof error.data.message === 'string' &&
        isObject(duplicate) &&
        typeof duplicate.company_name === 'string' &&
        typeof duplicate.job_title === 'string' &&
        hasParseableApplicationDate(duplicate.application_date)
    );
};

const applicationTimestamp = (applicationDate: string): number => {
    const timestamp = Date.parse(applicationDate);
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

const toPotentialDuplicate = (
    request: CreateApplicationRequest,
    application: JobApplication | ArchivedJobApplication,
    id: number,
    isArchived: boolean
): PotentialDuplicate | undefined => {
    const requestedUrl = request.jobURL.trim();
    const applicationUrl = application.job_posting_url.trim();
    const isUrlMatch = requestedUrl.length > 0 && applicationUrl.length > 0 && requestedUrl === applicationUrl;
    const isCompanyAndTitleMatch =
        normalizeDuplicateApplicationText(request.companyName) ===
            normalizeDuplicateApplicationText(application.company_name) &&
        normalizeDuplicateApplicationText(request.jobTitle) ===
            normalizeDuplicateApplicationText(application.job_title);

    if (!isUrlMatch && !isCompanyAndTitleMatch) {
        return undefined;
    }

    return {
        company_name: application.company_name,
        job_title: application.job_title,
        application_date: application.application_date,
        id,
        isArchived,
        isUrlMatch,
        timestamp: applicationTimestamp(application.application_date),
    };
};

export const findPotentialDuplicateApplication = (
    request: CreateApplicationRequest,
    applications: readonly JobApplication[],
    archivedApplications: readonly ArchivedJobApplication[]
): DuplicateApplicationDetails | undefined => {
    const matches = [
        ...applications.map((application) => toPotentialDuplicate(request, application, application.job_id, false)),
        ...archivedApplications.map((application) =>
            toPotentialDuplicate(request, application, application.archived_job_id, true)
        ),
    ].filter((application): application is PotentialDuplicate => application !== undefined);

    matches.sort(
        (left, right) =>
            Number(right.isUrlMatch) - Number(left.isUrlMatch) ||
            Number(left.isArchived) - Number(right.isArchived) ||
            right.timestamp - left.timestamp ||
            left.id - right.id
    );

    const match = matches[0];
    if (!match) {
        return undefined;
    }

    return {
        company_name: match.company_name,
        job_title: match.job_title,
        application_date: match.application_date,
    };
};
