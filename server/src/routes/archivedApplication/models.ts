import type {
    ApplicationCollectionSummary,
    ApplicationRelationSummary,
    ArchivedJobApplication,
} from '../../db/models.js';
import type { ErrorResponse } from '../../http/models.js';
export type { EmptyResponse } from '../../http/models.js';

export type ArchiveApplicationRequest = {
    jobId: number;
};

export type ArchivedJobIdParams = {
    archivedJobId: string;
};

export type ListArchivedApplicationsQuery = {
    jobStatuses?: string | string[];
};

export type ListArchivedApplicationsResponse = ArchivedJobApplication[] | ErrorResponse;
export type GetArchivedApplicationCollectionSummaryResponse = ApplicationCollectionSummary | ErrorResponse;
export type GetArchivedApplicationRelationSummaryResponse = ApplicationRelationSummary | ErrorResponse;
