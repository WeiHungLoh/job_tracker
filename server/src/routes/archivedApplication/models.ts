import type { ArchivedJobApplication } from '../../db/models.js';
import type { ErrorResponse } from '../../http/models.js';

export type ArchiveApplicationRequest = {
    jobId: number;
};

export type ArchivedJobIdParams = {
    archivedJobId: string;
};

export type ListArchivedApplicationsQuery = {
    jobStatus?: string;
};

export type ArchiveApplicationResponse = string | ErrorResponse;
export type ListArchivedApplicationsResponse = ArchivedJobApplication[] | ErrorResponse;
export type EmptyResponse = undefined | ErrorResponse;
