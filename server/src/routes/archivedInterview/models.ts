import type { ArchivedJobInterview } from '../../db/models.js';
import type { ErrorResponse } from '../../http/models.js';
export type { EmptyResponse } from '../../http/models.js';

export type ArchivedInterviewIdParams = {
    archivedInterviewId: string;
};

export type ListArchivedInterviewsResponse = ArchivedJobInterview[] | ErrorResponse;
