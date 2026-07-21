import type { JobStatus } from './models';

export const isApplicationStatusDisabled = (
    jobStatus: JobStatus,
    hasInterview: boolean,
    hasOfferEvaluation: boolean
): boolean =>
    (jobStatus === 'Applied' && hasInterview) ||
    (hasOfferEvaluation && jobStatus !== 'Offer' && jobStatus !== 'Accepted' && jobStatus !== 'Declined');
