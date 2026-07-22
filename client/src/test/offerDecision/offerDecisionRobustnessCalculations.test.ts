import { calculateOfferDecisionScore } from '../../pages/offerDecision/offerEvaluation';
import type { OfferDecisionApplication, OfferDecisionValues } from '../../pages/offerDecision/models';
import {
    DEFAULT_OFFER_DECISION_IMPORTANCE,
    analyzeOfferDecisionRobustness,
    calculateWeightedOfferDecisionScore,
    isEvaluatedOfferDecisionApplication,
    type EvaluatedOfferDecisionApplication,
    type OfferDecisionImportance,
} from '../../pages/offerDecision/robustness/offerDecisionRobustnessCalculations';

const details = {
    currency: 'SGD',
    monthly_base_salary: 10000,
    bonus: '',
    annual_leave_days: 20,
    work_arrangement: 'Hybrid' as const,
    decision_deadline: '2026-08-15T10:00:00.000Z',
    pros: '',
    concerns: '',
};

const createApplication = (
    jobId: number,
    companyName: string,
    ratings: OfferDecisionValues
): EvaluatedOfferDecisionApplication => ({
    job_id: jobId,
    company_name: companyName,
    job_title: 'Software Engineer',
    job_status: 'Offer',
    application_date: '2026-07-01T08:00:00.000Z',
    evaluation: {
        job_id: jobId,
        ratings,
        details,
        updated_at: '2026-07-18T08:00:00.000Z',
    },
});

describe('offer decision robustness calculations', () => {
    test('recognizes only applications with saved evaluations', () => {
        const evaluated = createApplication(1, 'Acme', {
            career_growth: 5,
            company_culture_fit: 4,
            work_life_balance: 3,
            compensation: 3,
        });
        const unevaluated: OfferDecisionApplication = { ...evaluated, evaluation: null };

        expect(isEvaluatedOfferDecisionApplication(evaluated)).toBe(true);
        expect(isEvaluatedOfferDecisionApplication(unevaluated)).toBe(false);
    });

    test('balanced importance reproduces the existing equal-weight score', () => {
        const ratings: OfferDecisionValues = {
            career_growth: 5,
            company_culture_fit: 4,
            work_life_balance: 3,
            compensation: 3,
        };

        expect(calculateWeightedOfferDecisionScore(ratings, DEFAULT_OFFER_DECISION_IMPORTANCE)).toBe(
            calculateOfferDecisionScore(ratings)
        );
    });

    test('changes the leader when career growth becomes more important', () => {
        const applications = [
            createApplication(1, 'Acme', {
                career_growth: 5,
                company_culture_fit: 4,
                work_life_balance: 3,
                compensation: 3,
            }),
            createApplication(2, 'Beta Labs', {
                career_growth: 3,
                company_culture_fit: 3,
                work_life_balance: 5,
                compensation: 5,
            }),
        ];
        const growthFirst: OfferDecisionImportance = {
            ...DEFAULT_OFFER_DECISION_IMPORTANCE,
            career_growth: 5,
        };

        expect(
            analyzeOfferDecisionRobustness(applications, DEFAULT_OFFER_DECISION_IMPORTANCE).currentTopJobIds
        ).toEqual([2]);
        expect(analyzeOfferDecisionRobustness(applications, growthFirst).currentTopJobIds).toEqual([1]);
    });

    test('generates unique bounded nearby scenarios', () => {
        const applications = [
            createApplication(1, 'Acme', {
                career_growth: 5,
                company_culture_fit: 4,
                work_life_balance: 3,
                compensation: 3,
            }),
            createApplication(2, 'Beta Labs', {
                career_growth: 3,
                company_culture_fit: 3,
                work_life_balance: 5,
                compensation: 5,
            }),
        ];

        expect(analyzeOfferDecisionRobustness(applications, DEFAULT_OFFER_DECISION_IMPORTANCE).scenarioCount).toBe(81);
        expect(
            analyzeOfferDecisionRobustness(applications, {
                career_growth: 1,
                company_culture_fit: 1,
                work_life_balance: 1,
                compensation: 1,
            }).scenarioCount
        ).toBe(16);
    });

    test('retains ties and finds the nearest changed set of leaders', () => {
        const applications = [
            createApplication(1, 'Acme', {
                career_growth: 4,
                company_culture_fit: 2,
                work_life_balance: 3,
                compensation: 4,
            }),
            createApplication(2, 'Beta Labs', {
                career_growth: 3,
                company_culture_fit: 4,
                work_life_balance: 3,
                compensation: 3,
            }),
        ];
        const importance: OfferDecisionImportance = {
            career_growth: 3,
            company_culture_fit: 2,
            work_life_balance: 3,
            compensation: 3,
        };

        const analysis = analyzeOfferDecisionRobustness(applications, importance);

        expect(analysis.currentTopJobIds).toEqual([1]);
        expect(analysis.nearestChangedScenario).toEqual(
            expect.objectContaining({
                distance: 1,
                importance: { ...importance, company_culture_fit: 3 },
                topJobIds: [1, 2],
            })
        );
    });

    test('keeps identical rating profiles tied in every tested mix without mutating inputs', () => {
        const ratings: OfferDecisionValues = {
            career_growth: 4,
            company_culture_fit: 3,
            work_life_balance: 5,
            compensation: 2,
        };
        const applications = [createApplication(1, 'Acme', ratings), createApplication(2, 'Beta Labs', { ...ratings })];
        const snapshot = structuredClone(applications);

        const analysis = analyzeOfferDecisionRobustness(applications, DEFAULT_OFFER_DECISION_IMPORTANCE);

        expect(analysis.identicalProfiles).toBe(true);
        expect(analysis.currentTopJobIds).toEqual([1, 2]);
        expect(analysis.nearestChangedScenario).toBeNull();
        expect(analysis.leaderCounts[1]).toEqual({ sole: 0, tied: 81 });
        expect(analysis.leaderCounts[2]).toEqual({ sole: 0, tied: 81 });
        expect(applications).toEqual(snapshot);
    });

    test('requires at least two evaluated offers', () => {
        const application = createApplication(1, 'Acme', {
            career_growth: 5,
            company_culture_fit: 4,
            work_life_balance: 3,
            compensation: 3,
        });

        expect(() => analyzeOfferDecisionRobustness([application], DEFAULT_OFFER_DECISION_IMPORTANCE)).toThrow(
            'At least two evaluated offers are required.'
        );
    });
});
