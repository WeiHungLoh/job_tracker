import type { ArchivedJobApplication, JobStatusFilter } from '../../db/models.js';
import type { ErrorResponse } from '../../http/models.js';
export type { EmptyResponse } from '../../http/models.js';

export type ArchiveApplicationRequest = {
    jobId: number;
};

export type ArchivedJobIdParams = {
    archivedJobId: string;
};

export type ListArchivedApplicationsQuery = {
    jobStatus?: JobStatusFilter;
};

export type ArchiveApplicationResponse = string | ErrorResponse;
export type ListArchivedApplicationsResponse = ArchivedJobApplication[] | ErrorResponse;
