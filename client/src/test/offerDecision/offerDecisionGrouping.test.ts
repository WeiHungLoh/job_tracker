import {
    groupOfferDecisionApplications,
    isOfferDecisionDeadlineExpired,
    sortEvaluatedOffers,
    sortPreviousOfferEvaluations,
} from '../../pages/offerDecision/offerDecisionGrouping';
import type { OfferDecisionApplication, OfferDecisionValues, OfferEvaluation } from '../../pages/offerDecision/models';

const defaultRatings: OfferDecisionValues = {
    career_growth: 4,
    company_culture_fit: 4,
    work_life_balance: 4,
    compensation: 4,
};

const createEvaluation = (
    jobId: number,
    ratings: OfferEvaluation['ratings'],
    decisionDeadline: string
): OfferEvaluation => ({
    job_id: jobId,
    ratings,
    details: {
        currency: 'SGD',
        monthly_base_salary: 10000,
        bonus: '15% target',
        annual_leave_days: 21,
        work_arrangement: 'Hybrid',
        decision_deadline: decisionDeadline,
        pros: 'Strong product ownership',
        concerns: 'Two office days each week',
    },
});

const createApplication = (
    jobId: number,
    ratings: OfferEvaluation['ratings'] = defaultRatings,
    decisionDeadline = '2026-08-01T10:00:00.000Z',
    companyName = `Company ${jobId}`,
    jobTitle = 'Engineer'
): OfferDecisionApplication => ({
    job_id: jobId,
    company_name: companyName,
    job_title: jobTitle,
    job_status: 'Offer',
    application_date: '2026-07-01T08:00:00.000Z',
    evaluation: createEvaluation(jobId, ratings, decisionDeadline),
});

describe('offer decision grouping', () => {
    test('sorts evaluated offers by deadline, fit score, then application name', () => {
        const highScore: OfferDecisionValues = {
            career_growth: 5,
            company_culture_fit: 5,
            work_life_balance: 5,
            compensation: 5,
        };
        const applications = [
            createApplication(5, defaultRatings, ''),
            createApplication(4, highScore, '2026-08-02T10:00:00.000Z', 'Zulu'),
            createApplication(3, defaultRatings, '2026-08-01T10:00:00.000Z', 'Beta'),
            createApplication(2, highScore, '2026-08-01T10:00:00.000Z', 'Gamma'),
            createApplication(1, highScore, '2026-08-01T10:00:00.000Z', 'Alpha'),
        ];

        expect(sortEvaluatedOffers(applications).map((application) => application.job_id)).toEqual([1, 2, 3, 4, 5]);
        expect(applications.map((application) => application.job_id)).toEqual([5, 4, 3, 2, 1]);
    });

    test('sorts previous evaluations by fit score, then application name', () => {
        const highScore: OfferDecisionValues = {
            career_growth: 5,
            company_culture_fit: 5,
            work_life_balance: 5,
            compensation: 5,
        };
        const applications = [
            createApplication(4, defaultRatings, '2026-08-03T10:00:00.000Z', 'Zulu'),
            createApplication(3, highScore, '2026-08-02T10:00:00.000Z', 'Gamma'),
            createApplication(2, highScore, '2026-08-01T10:00:00.000Z', 'Alpha'),
            createApplication(1, defaultRatings, '2026-08-01T10:00:00.000Z', 'Beta'),
        ];

        expect(sortPreviousOfferEvaluations(applications).map((application) => application.job_id)).toEqual([
            2, 3, 1, 4,
        ]);
    });

    test('treats an offer decision deadline before the reference time as expired', () => {
        const referenceTime = new Date('2026-07-20T12:00:00.000Z');

        expect(isOfferDecisionDeadlineExpired('2026-07-20T11:59:59.999Z', referenceTime)).toBe(true);
        expect(isOfferDecisionDeadlineExpired('2026-07-20T12:00:00.000Z', referenceTime)).toBe(false);
        expect(isOfferDecisionDeadlineExpired('', referenceTime)).toBe(false);
        expect(isOfferDecisionDeadlineExpired('not-a-date', referenceTime)).toBe(false);
    });

    test('groups current offers by evaluation deadline and keeps prior evaluations separate', () => {
        const referenceTime = new Date('2026-07-20T12:00:00.000Z');
        const offerToEvaluate = { ...createApplication(1), evaluation: null };
        const currentEvaluation = createApplication(2, defaultRatings, '2026-07-21T12:00:00.000Z');
        const expiredEvaluation = createApplication(3, defaultRatings, '2026-07-20T11:59:59.999Z');
        const previousEvaluation = { ...createApplication(4), job_status: 'Interview' as const };

        const groups = groupOfferDecisionApplications(
            [previousEvaluation, expiredEvaluation, currentEvaluation, offerToEvaluate],
            referenceTime
        );

        expect(groups['Offers to Evaluate'].map((application) => application.job_id)).toEqual([1]);
        expect(groups['Evaluated Offers'].map((application) => application.job_id)).toEqual([2]);
        expect(groups['Expired Evaluated Offers'].map((application) => application.job_id)).toEqual([3]);
        expect(groups['Previous Evaluations'].map((application) => application.job_id)).toEqual([4]);
    });
});
