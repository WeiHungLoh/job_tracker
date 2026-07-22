import formatDate from '../../helper/dateFormatter';
import { escapeCsvFormula } from '../../helper/csvData';
import { calculateOfferDecisionScore } from './offerEvaluation';
import { OFFER_DECISION_FILTER_CONFIG } from './models';
import type { OfferDecisionApplication, OfferDecisionFilter, OfferDecisionGroups } from './models';

const OFFER_EVALUATION_CSV_HEADERS = [
    'Company',
    'Job Title',
    'Status',
    'Application Date',
    'Currency',
    'Monthly Base Salary',
    'Bonus',
    'Annual Leave Days',
    'Work Arrangement',
    'Decision Deadline',
    'Pros',
    'Concerns',
    'Career Growth Rating',
    'Company/Culture Fit Rating',
    'Work-Life Balance Rating',
    'Compensation Rating',
    'Fit Rating (%)',
    'Updated Date',
] as const;

const OFFER_EVALUATION_CSV_SEPARATOR = OFFER_EVALUATION_CSV_HEADERS.map(() => '');

const EXPORTABLE_FILTERS = (Object.keys(OFFER_DECISION_FILTER_CONFIG) as OfferDecisionFilter[]).filter(
    (filter) => OFFER_DECISION_FILTER_CONFIG[filter].exportable
);

const textValue = (value: string): string => String(escapeCsvFormula(value || 'N/A')).replaceAll('"', '""');

const dateValue = (value: string): string => (value ? formatDate(value).formattedDate : 'N/A');

const createEvaluationRow = (application: OfferDecisionApplication): Array<string | number> => {
    const evaluation = application.evaluation;
    if (!evaluation) {
        return [];
    }

    return [
        textValue(application.company_name),
        textValue(application.job_title),
        textValue(application.job_status),
        dateValue(application.application_date),
        textValue(evaluation.details.currency),
        evaluation.details.monthly_base_salary ?? 'N/A',
        textValue(evaluation.details.bonus),
        evaluation.details.annual_leave_days ?? 'N/A',
        textValue(evaluation.details.work_arrangement),
        dateValue(evaluation.details.decision_deadline),
        textValue(evaluation.details.pros),
        textValue(evaluation.details.concerns),
        evaluation.ratings.career_growth,
        evaluation.ratings.company_culture_fit,
        evaluation.ratings.work_life_balance,
        evaluation.ratings.compensation,
        calculateOfferDecisionScore(evaluation.ratings),
        dateValue(evaluation.updated_at),
    ];
};

export const createOfferEvaluationCsvData = (
    groups: OfferDecisionGroups,
    selectedFilters: readonly OfferDecisionFilter[]
): Array<Array<string | number>> => {
    const selectedGroups = EXPORTABLE_FILTERS.filter(
        (filter) => selectedFilters.includes(filter) && groups[filter].length > 0
    );
    if (selectedGroups.length === 0) {
        return [];
    }

    return selectedGroups.flatMap((filter, index) => [
        ...(index === 0 ? [] : [OFFER_EVALUATION_CSV_SEPARATOR]),
        [filter],
        [...OFFER_EVALUATION_CSV_HEADERS],
        ...groups[filter].map(createEvaluationRow),
    ]);
};
