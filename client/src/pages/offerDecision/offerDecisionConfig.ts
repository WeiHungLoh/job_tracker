import type {
    ArchivedOfferDecisionFilter,
    OfferDecisionCategoryConfig,
    OfferDecisionFilter,
    OfferDecisionValues,
    OfferDetails,
    OfferWorkArrangement,
} from './models';

type OfferDecisionFilterConfig = {
    availableWhenArchived: boolean;
    exportable: boolean;
};

export const OFFER_DECISION_FILTER_CONFIG = {
    'Offers to Evaluate': { availableWhenArchived: false, exportable: false },
    'Evaluated Offers': { availableWhenArchived: true, exportable: true },
    'Expired Evaluated Offers': { availableWhenArchived: true, exportable: true },
    'Previous Evaluations': { availableWhenArchived: true, exportable: true },
} as const satisfies Record<OfferDecisionFilter, OfferDecisionFilterConfig>;

export const OFFER_DECISION_VALUE_MIN = 1;
export const OFFER_DECISION_VALUE_MAX = 5;
export const OFFER_MONTHLY_BASE_SALARY_MAX = 1_000_000_000;
export const OFFER_ANNUAL_LEAVE_DAYS_MAX = 365;

export const OFFER_DECISION_CATEGORIES: readonly OfferDecisionCategoryConfig[] = [
    { key: 'career_growth', label: 'Career Growth' },
    { key: 'company_culture_fit', label: 'Company/Culture Fit' },
    { key: 'work_life_balance', label: 'Work-Life Balance' },
    { key: 'compensation', label: 'Compensation' },
];

export const DEFAULT_OFFER_DECISION_VALUES: OfferDecisionValues = {
    career_growth: 3,
    company_culture_fit: 3,
    work_life_balance: 3,
    compensation: 3,
};

export const OFFER_WORK_ARRANGEMENTS: readonly Exclude<OfferWorkArrangement, ''>[] = [
    'Remote',
    'Hybrid',
    'On-site',
    'Flexible',
];

export const OFFER_DETAILS_MAX_LENGTHS = {
    bonus: 200,
    notes: 1000,
} as const;

export const DEFAULT_OFFER_DETAILS: OfferDetails = {
    currency: 'SGD',
    monthly_base_salary: null,
    bonus: '',
    annual_leave_days: null,
    work_arrangement: '',
    decision_deadline: '',
    pros: '',
    concerns: '',
};

export const ACTIVE_OFFER_DECISION_FILTERS = Object.keys(OFFER_DECISION_FILTER_CONFIG) as OfferDecisionFilter[];

export const ARCHIVED_OFFER_DECISION_FILTERS = ACTIVE_OFFER_DECISION_FILTERS.filter(
    (filter): filter is ArchivedOfferDecisionFilter => OFFER_DECISION_FILTER_CONFIG[filter].availableWhenArchived
);

export const isArchivedOfferDecisionFilter = (filter: OfferDecisionFilter): filter is ArchivedOfferDecisionFilter =>
    ARCHIVED_OFFER_DECISION_FILTERS.some((archivedFilter) => archivedFilter === filter);
