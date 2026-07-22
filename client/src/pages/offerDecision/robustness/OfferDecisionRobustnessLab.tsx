import { useMemo, useState } from 'react';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { OFFER_DECISION_CATEGORIES } from '../offerDecisionConfig';
import type { OfferDecisionCategory, OfferDecisionRating } from '../models';
import {
    DEFAULT_OFFER_DECISION_IMPORTANCE,
    analyzeOfferDecisionRobustness,
    type EvaluatedOfferDecisionApplication,
    type OfferDecisionImportance,
} from './offerDecisionRobustnessCalculations';
import styles from './OfferDecisionRobustnessLab.module.css';

type OfferDecisionRobustnessLabProps = {
    applications: readonly EvaluatedOfferDecisionApplication[];
    disabled: boolean;
};

const PANEL_ID = 'offer-decision-robustness-panel';

const createBalancedImportance = (): OfferDecisionImportance => ({
    ...DEFAULT_OFFER_DECISION_IMPORTANCE,
});

const getOfferName = (jobId: number, applications: readonly EvaluatedOfferDecisionApplication[]): string => {
    const application = applications.find((candidate) => candidate.job_id === jobId);
    return application ? `${application.company_name} ${application.job_title}` : 'Unknown offer';
};

const joinOfferNames = (
    jobIds: readonly number[],
    applications: readonly EvaluatedOfferDecisionApplication[]
): string => {
    const names = jobIds.map((jobId) => getOfferName(jobId, applications));
    if (names.length < 2) {
        return names[0] ?? '';
    }
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

const describeImportanceChanges = (current: OfferDecisionImportance, changed: OfferDecisionImportance): string =>
    OFFER_DECISION_CATEGORIES.filter((category) => current[category.key] !== changed[category.key])
        .map((category) => {
            const direction = changed[category.key] > current[category.key] ? 'increase' : 'decrease';
            return `${direction} ${category.label} from ${current[category.key]} to ${changed[category.key]}`;
        })
        .join(' and ');

const OfferDecisionRobustnessLab = ({ applications, disabled }: OfferDecisionRobustnessLabProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [importance, setImportance] = useState<OfferDecisionImportance>(createBalancedImportance);

    const analysis = useMemo(
        () => (applications.length >= 2 ? analyzeOfferDecisionRobustness(applications, importance) : null),
        [applications, importance]
    );

    if (!analysis) {
        return null;
    }

    const currentLeaderNames = joinOfferNames(analysis.currentTopJobIds, applications);
    const currentSummary =
        analysis.currentTopJobIds.length === 1
            ? `With these priorities, ${currentLeaderNames} is your top match.`
            : `With these priorities, ${currentLeaderNames} are tied as your top matches.`;

    const changedScenario = analysis.nearestChangedScenario;
    const changedLeaderNames = changedScenario ? joinOfferNames(changedScenario.topJobIds, applications) : '';
    let changedSummary = 'Your top match stays the same when each priority moves one point up or down.';
    if (analysis.identicalProfiles) {
        changedSummary = 'These offers have the same saved ratings, so changing priorities cannot separate them.';
    } else if (changedScenario) {
        const changedOutcome =
            changedScenario.topJobIds.length === 1
                ? `${changedLeaderNames} becomes your top match.`
                : `${changedLeaderNames} become tied as your top matches.`;
        changedSummary = `If you ${describeImportanceChanges(importance, changedScenario.importance)}, ${changedOutcome}`;
    }

    const closeLab = () => {
        setImportance(createBalancedImportance());
        setIsOpen(false);
    };

    const updateImportance = (category: OfferDecisionCategory, value: OfferDecisionRating) => {
        setImportance((current) => ({ ...current, [category]: value }));
    };

    return (
        <section aria-labelledby='robustness-lab-heading' className={styles.lab}>
            <div className={styles.header}>
                <div>
                    <h3 id='robustness-lab-heading'>Try different priorities</h3>
                    <p>Change what matters most and see whether your top offer changes.</p>
                </div>
                <PrimaryButton
                    aria-controls={PANEL_ID}
                    aria-expanded={isOpen}
                    disabled={disabled && !isOpen}
                    onClick={isOpen ? closeLab : () => setIsOpen(true)}
                    type='button'
                    variant='secondary'
                >
                    {isOpen ? 'Close' : 'Try priorities'}
                </PrimaryButton>
            </div>

            {disabled && (
                <p className={styles.disabledMessage}>
                    Save or cancel the open evaluation before trying different priorities.
                </p>
            )}

            {isOpen && (
                <div className={styles.content} id={PANEL_ID}>
                    <div className={styles.controls}>
                        <p className={styles.temporaryNote}>
                            This uses your saved ratings for a quick comparison. Nothing here is saved.
                        </p>
                        <fieldset className={styles.importanceFields} disabled={disabled}>
                            <legend>How important is each category?</legend>
                            {OFFER_DECISION_CATEGORIES.map((category) => {
                                const inputId = `robustness-importance-${category.key}`;
                                const value = importance[category.key];
                                return (
                                    <label className={styles.importanceField} htmlFor={inputId} key={category.key}>
                                        <span className={styles.importanceHeader}>
                                            <strong>{category.label}</strong>
                                            <output htmlFor={inputId}>{value} / 5</output>
                                        </span>
                                        <input
                                            aria-label={`${category.label} importance`}
                                            id={inputId}
                                            max={5}
                                            min={1}
                                            onChange={(event) =>
                                                updateImportance(
                                                    category.key,
                                                    Number(event.target.value) as OfferDecisionRating
                                                )
                                            }
                                            step={1}
                                            type='range'
                                            value={value}
                                        />
                                    </label>
                                );
                            })}
                        </fieldset>
                        <PrimaryButton
                            aria-label='Reset importance to balanced'
                            disabled={disabled}
                            onClick={() => setImportance(createBalancedImportance())}
                            type='button'
                            variant='secondary'
                        >
                            Reset to balanced
                        </PrimaryButton>
                    </div>

                    <div className={styles.results}>
                        <h4>Results with these priorities</h4>
                        <ol aria-label='Offer results' className={styles.ranking}>
                            {analysis.currentRanking.map((result) => (
                                <li key={result.jobId}>
                                    <div className={styles.rankingHeader}>
                                        <span>
                                            <strong>{result.companyName}</strong>
                                            <span>{result.jobTitle}</span>
                                        </span>
                                        <strong>Match score: {result.score}%</strong>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        <div aria-atomic='true' aria-live='polite' className={styles.summary}>
                            <p>{currentSummary}</p>
                            <p>{changedSummary}</p>
                        </div>
                        <details className={styles.explanation}>
                            <summary>How this test works</summary>
                            <p>
                                The app uses your saved offer ratings and gives more weight to the categories you mark
                                as important. It also makes small changes to your priorities to see how easily your top
                                match changes. Nothing is saved.
                            </p>
                        </details>
                    </div>
                </div>
            )}
        </section>
    );
};

export default OfferDecisionRobustnessLab;
