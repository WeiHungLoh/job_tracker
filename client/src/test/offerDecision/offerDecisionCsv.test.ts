import { createOfferEvaluationCsvData } from '../../pages/offerDecision/offerDecisionCsv';
import { groupOfferDecisionApplications } from '../../pages/offerDecision/offerDecisionGrouping';
import type { OfferDecisionApplication, OfferEvaluation } from '../../pages/offerDecision/models';

const createEvaluation = (jobId: number, overrides: Partial<OfferEvaluation['details']> = {}): OfferEvaluation => ({
    job_id: jobId,
    ratings: {
        career_growth: 5,
        company_culture_fit: 4,
        work_life_balance: 3,
        compensation: 4,
    },
    details: {
        currency: 'SGD',
        monthly_base_salary: 10000,
        bonus: '',
        annual_leave_days: null,
        work_arrangement: '',
        decision_deadline: '2026-08-15T10:00:00.000Z',
        pros: '=Strong, ownership',
        concerns: 'Line one\n"Line two"',
        ...overrides,
    },
    updated_at: '2026-07-18T08:00:00.000Z',
});

const createApplication = (
    jobId: number,
    jobStatus: OfferDecisionApplication['job_status'],
    evaluation: OfferEvaluation | null
): OfferDecisionApplication => ({
    job_id: jobId,
    company_name: jobId === 1 ? 'Acme, Inc.' : 'Beta',
    job_title: 'Engineer',
    job_status: jobStatus,
    application_date: '2026-07-01T08:00:00.000Z',
    evaluation,
});

describe('offer evaluation CSV data', () => {
    test('exports one selected category as one titled table and omits unevaluated offers', () => {
        const groups = groupOfferDecisionApplications([
            createApplication(1, 'Offer', createEvaluation(1)),
            createApplication(2, 'Offer', null),
        ]);
        const csvData = createOfferEvaluationCsvData(groups, ['Evaluated Offers']);

        expect(csvData).toHaveLength(3);
        expect(csvData[0]).toEqual(['Evaluated Offers']);
        expect(csvData[1][0]).toBe('Company');
        expect(csvData[2][0]).toBe('Acme, Inc.');
        expect(csvData.flat()).not.toContain('Offers to Evaluate');
        expect(csvData.flat()).not.toContain(2);
    });

    test('exports two selected categories as separate tables with headers and a blank separator', () => {
        const groups = groupOfferDecisionApplications([
            createApplication(1, 'Offer', createEvaluation(1)),
            createApplication(2, 'Accepted', createEvaluation(2)),
        ]);
        const csvData = createOfferEvaluationCsvData(groups, ['Evaluated Offers', 'Previous Evaluations']);
        const flattened = csvData.flat();

        expect(csvData.map((row) => row[0])).toEqual([
            'Evaluated Offers',
            'Company',
            'Acme, Inc.',
            '',
            'Previous Evaluations',
            'Company',
            'Beta',
        ]);
        expect(csvData.filter((row) => row[0] === 'Company')).toHaveLength(2);
        expect(csvData[3]).toHaveLength(csvData[1].length);
        expect(csvData[3].every((value) => value === '')).toBe(true);
        expect(flattened).toContain('N/A');
        expect(flattened).toContain("'=Strong, ownership");
        expect(flattened).toContain('Line one\n""Line two""');
        expect(flattened).not.toContain('job_id');
    });

    test('exports three non-empty categories in canonical order and skips empty selected categories', () => {
        const groups = groupOfferDecisionApplications([
            createApplication(1, 'Offer', createEvaluation(1)),
            createApplication(2, 'Offer', createEvaluation(2, { decision_deadline: '2026-07-01T10:00:00.000Z' })),
            createApplication(3, 'Accepted', createEvaluation(3)),
        ]);
        const csvData = createOfferEvaluationCsvData(groups, [
            'Previous Evaluations',
            'Offers to Evaluate',
            'Expired Evaluated Offers',
            'Evaluated Offers',
        ]);

        expect(
            csvData.filter((row) => row.length === csvData[1].length && row.every((value) => value === ''))
        ).toHaveLength(2);
        expect(csvData.filter((row) => row[0] === 'Company')).toHaveLength(3);
        expect(csvData.filter((row) => row.length === 1 && typeof row[0] === 'string').map((row) => row[0])).toEqual([
            'Evaluated Offers',
            'Expired Evaluated Offers',
            'Previous Evaluations',
        ]);
        expect(csvData.flat()).not.toContain('Offers to Evaluate');

        const onlyPrevious = createOfferEvaluationCsvData(groups, ['Offers to Evaluate', 'Previous Evaluations']);
        expect(onlyPrevious[0]).toEqual(['Previous Evaluations']);
        expect(onlyPrevious.filter((row) => row[0] === 'Company')).toHaveLength(1);
        expect(onlyPrevious.filter((row) => row.every((value) => value === ''))).toHaveLength(0);
    });

    test('returns no export rows when only Offers to Evaluate is selected', () => {
        const groups = groupOfferDecisionApplications([createApplication(2, 'Offer', null)]);

        expect(createOfferEvaluationCsvData(groups, ['Offers to Evaluate'])).toEqual([]);
    });
});
