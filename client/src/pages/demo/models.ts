import type { ArchivedJobApplication, JobApplication } from '../application/models';
import type { ArchivedJobInterview, JobInterview } from '../interview/models';
import type { UserPreferences } from '../../components/userPreferences/models';
import type { OfferEvaluation } from '../offerDecision/models';

export type DemoState = {
    applications: JobApplication[];
    archivedApplications: ArchivedJobApplication[];
    interviews: JobInterview[];
    archivedInterviews: ArchivedJobInterview[];
    offerEvaluations: Record<number, OfferEvaluation>;
    preferences: UserPreferences;
    nextApplicationId: number;
    nextInterviewId: number;
};
