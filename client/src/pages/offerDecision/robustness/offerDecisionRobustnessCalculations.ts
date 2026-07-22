import {
    DEFAULT_OFFER_DECISION_VALUES,
    OFFER_DECISION_CATEGORIES,
    OFFER_DECISION_VALUE_MAX,
    OFFER_DECISION_VALUE_MIN,
} from '../offerDecisionConfig';
import type {
    OfferDecisionApplication,
    OfferDecisionCategory,
    OfferDecisionRating,
    OfferDecisionValues,
    OfferEvaluation,
} from '../models';

export type OfferDecisionImportance = Record<OfferDecisionCategory, OfferDecisionRating>;

export type EvaluatedOfferDecisionApplication = OfferDecisionApplication & {
    evaluation: OfferEvaluation;
};

export type WeightedOfferDecisionResult = {
    companyName: string;
    jobId: number;
    jobTitle: string;
    numerator: number;
    score: number;
};

export type OfferDecisionLeaderCount = {
    sole: number;
    tied: number;
};

export type OfferDecisionChangedScenario = {
    distance: number;
    importance: OfferDecisionImportance;
    topJobIds: number[];
};

export type OfferDecisionRobustnessAnalysis = {
    currentRanking: WeightedOfferDecisionResult[];
    currentTopJobIds: number[];
    identicalProfiles: boolean;
    leaderCounts: Record<number, OfferDecisionLeaderCount>;
    nearestChangedScenario: OfferDecisionChangedScenario | null;
    scenarioCount: number;
};

export const DEFAULT_OFFER_DECISION_IMPORTANCE: OfferDecisionImportance = {
    ...DEFAULT_OFFER_DECISION_VALUES,
};

export const isEvaluatedOfferDecisionApplication = (
    application: OfferDecisionApplication
): application is EvaluatedOfferDecisionApplication => application.evaluation !== null;

const getWeightedNumerator = (ratings: OfferDecisionValues, importance: OfferDecisionImportance): number =>
    OFFER_DECISION_CATEGORIES.reduce((total, category) => total + ratings[category.key] * importance[category.key], 0);

const getImportanceTotal = (importance: OfferDecisionImportance): number =>
    OFFER_DECISION_CATEGORIES.reduce((total, category) => total + importance[category.key], 0);

export const calculateWeightedOfferDecisionScore = (
    ratings: OfferDecisionValues,
    importance: OfferDecisionImportance
): number =>
    Math.round(
        (getWeightedNumerator(ratings, importance) / (OFFER_DECISION_VALUE_MAX * getImportanceTotal(importance))) * 100
    );

const rankOffers = (
    applications: readonly EvaluatedOfferDecisionApplication[],
    importance: OfferDecisionImportance
): WeightedOfferDecisionResult[] =>
    applications
        .map((application) => {
            const numerator = getWeightedNumerator(application.evaluation.ratings, importance);
            return {
                companyName: application.company_name,
                jobId: application.job_id,
                jobTitle: application.job_title,
                numerator,
                score: calculateWeightedOfferDecisionScore(application.evaluation.ratings, importance),
            };
        })
        .sort((first, second) => {
            if (first.numerator !== second.numerator) {
                return second.numerator - first.numerator;
            }
            const companyDifference = first.companyName.localeCompare(second.companyName);
            if (companyDifference !== 0) {
                return companyDifference;
            }
            const titleDifference = first.jobTitle.localeCompare(second.jobTitle);
            return titleDifference !== 0 ? titleDifference : first.jobId - second.jobId;
        });

const getTopJobIds = (ranking: readonly WeightedOfferDecisionResult[]): number[] => {
    const highestNumerator = ranking[0]?.numerator;
    return ranking
        .filter((result) => result.numerator === highestNumerator)
        .map((result) => result.jobId)
        .sort((first, second) => first - second);
};

const topSetsAreEqual = (first: readonly number[], second: readonly number[]): boolean =>
    first.length === second.length && first.every((jobId, index) => jobId === second[index]);

const getNearbyValues = (value: OfferDecisionRating): OfferDecisionRating[] =>
    [
        ...new Set([
            Math.max(OFFER_DECISION_VALUE_MIN, value - 1),
            value,
            Math.min(OFFER_DECISION_VALUE_MAX, value + 1),
        ]),
    ] as OfferDecisionRating[];

const createNearbyScenarios = (importance: OfferDecisionImportance): OfferDecisionImportance[] => {
    let scenarios: OfferDecisionImportance[] = [{ ...importance }];

    OFFER_DECISION_CATEGORIES.forEach((category) => {
        scenarios = scenarios.flatMap((scenario) =>
            getNearbyValues(importance[category.key]).map((value) => ({
                ...scenario,
                [category.key]: value,
            }))
        );
    });

    return scenarios;
};

const getScenarioDistance = (first: OfferDecisionImportance, second: OfferDecisionImportance): number =>
    OFFER_DECISION_CATEGORIES.reduce(
        (distance, category) => distance + Math.abs(first[category.key] - second[category.key]),
        0
    );

const compareImportance = (first: OfferDecisionImportance, second: OfferDecisionImportance): number => {
    for (const category of OFFER_DECISION_CATEGORIES) {
        const difference = first[category.key] - second[category.key];
        if (difference !== 0) {
            return difference;
        }
    }
    return 0;
};

const haveIdenticalProfiles = (applications: readonly EvaluatedOfferDecisionApplication[]): boolean => {
    const firstRatings = applications[0]?.evaluation.ratings;
    if (!firstRatings) {
        return false;
    }

    return applications.every((application) =>
        OFFER_DECISION_CATEGORIES.every(
            (category) => application.evaluation.ratings[category.key] === firstRatings[category.key]
        )
    );
};

export const analyzeOfferDecisionRobustness = (
    applications: readonly EvaluatedOfferDecisionApplication[],
    importance: OfferDecisionImportance
): OfferDecisionRobustnessAnalysis => {
    if (applications.length < 2) {
        throw new Error('At least two evaluated offers are required.');
    }

    const currentRanking = rankOffers(applications, importance);
    const currentTopJobIds = getTopJobIds(currentRanking);
    const scenarios = createNearbyScenarios(importance);
    const leaderCounts = Object.fromEntries(
        applications.map((application) => [application.job_id, { sole: 0, tied: 0 }])
    ) as Record<number, OfferDecisionLeaderCount>;
    let nearestChangedScenario: OfferDecisionChangedScenario | null = null;

    scenarios.forEach((scenarioImportance) => {
        const topJobIds = getTopJobIds(rankOffers(applications, scenarioImportance));
        const countKey = topJobIds.length === 1 ? 'sole' : 'tied';
        topJobIds.forEach((jobId) => {
            leaderCounts[jobId][countKey] += 1;
        });

        if (topSetsAreEqual(topJobIds, currentTopJobIds)) {
            return;
        }

        const candidate: OfferDecisionChangedScenario = {
            distance: getScenarioDistance(importance, scenarioImportance),
            importance: scenarioImportance,
            topJobIds,
        };

        if (
            nearestChangedScenario === null ||
            candidate.distance < nearestChangedScenario.distance ||
            (candidate.distance === nearestChangedScenario.distance &&
                compareImportance(candidate.importance, nearestChangedScenario.importance) < 0)
        ) {
            nearestChangedScenario = candidate;
        }
    });

    return {
        currentRanking,
        currentTopJobIds,
        identicalProfiles: haveIdenticalProfiles(applications),
        leaderCounts,
        nearestChangedScenario,
        scenarioCount: scenarios.length,
    };
};
