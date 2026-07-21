import { useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import { useConfirm } from 'material-ui-confirm';
import ApplicationStatusBadge from '../application/ApplicationStatusBadge';
import EmptyState from '../../components/emptyState/EmptyState';
import PrimaryButton from '../../components/button/PrimaryButton';
import { focusFirstInvalidField } from '../../components/formPage/focusFirstInvalidField';
import { createDeleteConfirmation } from '../../helper/deleteConfirmation';
import formatDate, {
    MAX_DATETIME_LOCAL,
    MIN_DATETIME_LOCAL,
    toDatetimeLocalInputValue,
} from '../../helper/dateFormatter';
import {
    OFFER_ANNUAL_LEAVE_DAYS_MAX,
    OFFER_DECISION_CATEGORIES,
    OFFER_DECISION_VALUE_MAX,
    OFFER_DECISION_VALUE_MIN,
    OFFER_DETAILS_MAX_LENGTHS,
    OFFER_MONTHLY_BASE_SALARY_MAX,
    OFFER_WORK_ARRANGEMENTS,
    calculateOfferDecisionScore,
    createDefaultOfferEvaluation,
    isOfferDecisionDeadlineExpired,
    offerEvaluationsAreEqual,
    sortEvaluatedOffers,
    sortPreviousOfferEvaluations,
    updateOfferDecisionValue,
    validateOfferEvaluation,
} from './offerDecisionData';
import type {
    OfferDecisionApplication,
    OfferDecisionCategory,
    OfferDecisionRating,
    OfferDecisionValues,
    OfferDecisionWorkspaceProps,
    OfferDetails,
    OfferEvaluation,
    OfferEvaluationFormErrors,
} from './models';
import styles from './OfferDecisionWorkspace.module.css';

type DraftEvaluations = Record<number, OfferEvaluation>;
type EvaluationErrors = Record<number, OfferEvaluationFormErrors>;

type OfferFieldRefs = {
    decision_deadline: RefObject<HTMLInputElement | null>;
    currency: RefObject<HTMLInputElement | null>;
    monthly_base_salary: RefObject<HTMLInputElement | null>;
    bonus: RefObject<HTMLInputElement | null>;
    annual_leave_days: RefObject<HTMLInputElement | null>;
    work_arrangement: RefObject<HTMLSelectElement | null>;
    pros: RefObject<HTMLTextAreaElement | null>;
    concerns: RefObject<HTMLTextAreaElement | null>;
};

type OfferEvaluationCardProps = {
    allowDelete: boolean;
    allowEdit: boolean;
    application: OfferDecisionApplication;
    draft: OfferEvaluation | undefined;
    errors: OfferEvaluationFormErrors;
    expanded: boolean;
    expired: boolean;
    isDeleting: boolean;
    isSaving: boolean;
    onCancel: () => void;
    onDelete?: () => void;
    onDetailsChange: (details: OfferDetails, field: keyof OfferEvaluationFormErrors) => void;
    onEdit: () => void;
    onRatingChange: (category: OfferDecisionCategory, value: OfferDecisionRating) => void;
    onSave: (decisionDeadlineHasBadInput: boolean, refs: OfferFieldRefs) => void;
    onStart: () => void;
    onToggleExpanded: () => void;
};

type ComparisonSectionProps = {
    applications: OfferDecisionApplication[];
    description: string;
    heading: string;
    id: string;
    renderCard: (application: OfferDecisionApplication) => ReactNode;
};

const cloneEvaluation = (evaluation: OfferEvaluation): OfferEvaluation => ({
    ...evaluation,
    ratings: { ...evaluation.ratings },
    details: {
        ...evaluation.details,
        decision_deadline: toDatetimeLocalInputValue(evaluation.details.decision_deadline),
    },
});

const removeRecordValue = <T,>(record: Record<number, T>, jobId: number): Record<number, T> => {
    const updatedRecord = { ...record };
    delete updatedRecord[jobId];
    return updatedRecord;
};

const getCardCount = (count: number): 'one' | 'two' | 'many' => {
    if (count === 1) {
        return 'one';
    }
    return count === 2 ? 'two' : 'many';
};

const FieldError = ({ id, message }: { id: string; message?: string }) =>
    message ? (
        <span className={styles.fieldError} id={id}>
            {message}
        </span>
    ) : null;

const getErrorProps = (id: string, message?: string) => ({
    'aria-describedby': message ? id : undefined,
    'aria-invalid': Boolean(message),
});

const DecisionScore = ({ companyName, score }: { companyName: string; score: number }) => (
    <div className={styles.score}>
        <div className={styles.scoreHeader}>
            <span>Fit rating</span>
            <strong>{score}%</strong>
        </div>
        <progress aria-label={`${companyName} offer fit rating`} max={100} value={score} />
    </div>
);

const DecisionDeadlineSummary = ({ deadline }: { deadline: string }) => (
    <div className={styles.deadlineSummary}>
        <span>Decision deadline</span>
        <strong>{formatDate(deadline).formattedDate}</strong>
    </div>
);

const RatingFields = ({
    application,
    evaluation,
    error,
    onChange,
}: {
    application: OfferDecisionApplication;
    evaluation: OfferEvaluation;
    error?: string;
    onChange: (category: OfferDecisionCategory, value: OfferDecisionRating) => void;
}) => (
    <fieldset className={styles.ratingFields}>
        <legend>Fit ratings</legend>
        {OFFER_DECISION_CATEGORIES.map((category) => {
            const id = `rating-${application.job_id}-${category.key}`;
            const value = evaluation.ratings[category.key];
            return (
                <label className={styles.ratingField} htmlFor={id} key={category.key}>
                    <span className={styles.ratingHeader}>
                        <strong>{category.label}</strong>
                        <output htmlFor={id}>{value}/5</output>
                    </span>
                    <input
                        aria-label={`${application.company_name} ${category.label} rating`}
                        id={id}
                        max={OFFER_DECISION_VALUE_MAX}
                        min={OFFER_DECISION_VALUE_MIN}
                        onChange={(event) => onChange(category.key, Number(event.target.value) as OfferDecisionRating)}
                        step={1}
                        type='range'
                        value={value}
                    />
                </label>
            );
        })}
        <FieldError id={`ratings-error-${application.job_id}`} message={error} />
    </fieldset>
);

const CompensationFields = ({
    application,
    details,
    errors,
    fieldRefs,
    onChange,
}: {
    application: OfferDecisionApplication;
    details: OfferDetails;
    errors: OfferEvaluationFormErrors;
    fieldRefs: OfferFieldRefs;
    onChange: (details: OfferDetails, field: keyof OfferEvaluationFormErrors) => void;
}) => {
    const updateDetails = (changes: Partial<OfferDetails>, field: keyof OfferEvaluationFormErrors) =>
        onChange({ ...details, ...changes }, field);
    const companyName = application.company_name;
    const jobId = application.job_id;

    return (
        <fieldset className={styles.detailsFields}>
            <legend>Compensation and terms</legend>
            <label className={styles.textField} htmlFor={`currency-${jobId}`}>
                <span>Currency</span>
                <input
                    ref={fieldRefs.currency}
                    {...getErrorProps(`currency-error-${jobId}`, errors.currency)}
                    aria-label={`${companyName} currency`}
                    id={`currency-${jobId}`}
                    maxLength={3}
                    onChange={(event) => updateDetails({ currency: event.target.value }, 'currency')}
                    required
                    value={details.currency}
                />
                <FieldError id={`currency-error-${jobId}`} message={errors.currency} />
            </label>
            <label className={styles.textField} htmlFor={`monthly-base-salary-${jobId}`}>
                <span>Monthly Base Salary</span>
                <input
                    ref={fieldRefs.monthly_base_salary}
                    {...getErrorProps(`monthly-base-salary-error-${jobId}`, errors.monthly_base_salary)}
                    aria-label={`${companyName} monthly base salary`}
                    id={`monthly-base-salary-${jobId}`}
                    max={OFFER_MONTHLY_BASE_SALARY_MAX}
                    min={0}
                    onChange={(event) =>
                        updateDetails(
                            { monthly_base_salary: event.target.value === '' ? null : Number(event.target.value) },
                            'monthly_base_salary'
                        )
                    }
                    required
                    step={1}
                    type='number'
                    value={details.monthly_base_salary ?? ''}
                />
                <FieldError id={`monthly-base-salary-error-${jobId}`} message={errors.monthly_base_salary} />
            </label>
            <label className={styles.textField} htmlFor={`bonus-${jobId}`}>
                <span>Bonus (Optional)</span>
                <input
                    ref={fieldRefs.bonus}
                    {...getErrorProps(`bonus-error-${jobId}`, errors.bonus)}
                    aria-label={`${companyName} bonus`}
                    id={`bonus-${jobId}`}
                    maxLength={OFFER_DETAILS_MAX_LENGTHS.bonus}
                    onChange={(event) => updateDetails({ bonus: event.target.value }, 'bonus')}
                    value={details.bonus}
                />
                <FieldError id={`bonus-error-${jobId}`} message={errors.bonus} />
            </label>
            <label className={styles.textField} htmlFor={`annual-leave-${jobId}`}>
                <span>Annual Leave Days (Optional)</span>
                <input
                    ref={fieldRefs.annual_leave_days}
                    {...getErrorProps(`annual-leave-error-${jobId}`, errors.annual_leave_days)}
                    aria-label={`${companyName} annual leave days`}
                    id={`annual-leave-${jobId}`}
                    max={OFFER_ANNUAL_LEAVE_DAYS_MAX}
                    min={0}
                    onChange={(event) =>
                        updateDetails(
                            { annual_leave_days: event.target.value === '' ? null : Number(event.target.value) },
                            'annual_leave_days'
                        )
                    }
                    step={1}
                    type='number'
                    value={details.annual_leave_days ?? ''}
                />
                <FieldError id={`annual-leave-error-${jobId}`} message={errors.annual_leave_days} />
            </label>
            <label className={styles.textField} htmlFor={`work-arrangement-${jobId}`}>
                <span>Work arrangement (Optional)</span>
                <select
                    ref={fieldRefs.work_arrangement}
                    {...getErrorProps(`work-arrangement-error-${jobId}`, errors.work_arrangement)}
                    aria-label={`${companyName} work arrangement`}
                    id={`work-arrangement-${jobId}`}
                    onChange={(event) =>
                        updateDetails(
                            { work_arrangement: event.target.value as OfferDetails['work_arrangement'] },
                            'work_arrangement'
                        )
                    }
                    value={details.work_arrangement}
                >
                    <option value=''></option>
                    {OFFER_WORK_ARRANGEMENTS.map((arrangement) => (
                        <option key={arrangement} value={arrangement}>
                            {arrangement}
                        </option>
                    ))}
                </select>
                <FieldError id={`work-arrangement-error-${jobId}`} message={errors.work_arrangement} />
            </label>
            <label className={styles.textField} htmlFor={`pros-${jobId}`}>
                <span>Pros (Optional)</span>
                <textarea
                    ref={fieldRefs.pros}
                    {...getErrorProps(`pros-error-${jobId}`, errors.pros)}
                    aria-label={`${companyName} pros`}
                    id={`pros-${jobId}`}
                    maxLength={OFFER_DETAILS_MAX_LENGTHS.notes}
                    onChange={(event) => updateDetails({ pros: event.target.value }, 'pros')}
                    rows={3}
                    value={details.pros}
                />
                <FieldError id={`pros-error-${jobId}`} message={errors.pros} />
            </label>
            <label className={styles.textField} htmlFor={`concerns-${jobId}`}>
                <span>Cons (Optional)</span>
                <textarea
                    ref={fieldRefs.concerns}
                    {...getErrorProps(`concerns-error-${jobId}`, errors.concerns)}
                    aria-label={`${companyName} cons`}
                    id={`concerns-${jobId}`}
                    maxLength={OFFER_DETAILS_MAX_LENGTHS.notes}
                    onChange={(event) => updateDetails({ concerns: event.target.value }, 'concerns')}
                    rows={3}
                    value={details.concerns}
                />
                <FieldError id={`concerns-error-${jobId}`} message={errors.concerns} />
            </label>
        </fieldset>
    );
};

const OfferRatingsReview = ({ ratings }: { ratings: OfferDecisionValues }) => (
    <div className={styles.reviewSection}>
        <h4>Fit breakdown</h4>
        <dl className={styles.reviewValues}>
            {OFFER_DECISION_CATEGORIES.map((category) => (
                <div className={styles.reviewValue} key={category.key}>
                    <dt>{category.label}</dt>
                    <dd>{ratings[category.key]}/5</dd>
                </div>
            ))}
        </dl>
    </div>
);

const OfferDetailsReview = ({ details }: { details: OfferDetails }) => (
    <div className={styles.reviewSection}>
        <h4>Compensation and terms</h4>
        <dl className={styles.detailsReview}>
            <div>
                <dt>Monthly Base Salary</dt>
                <dd>{`${details.currency} ${details.monthly_base_salary?.toLocaleString()}`}</dd>
            </div>
            {details.bonus !== '' && (
                <div>
                    <dt>Bonus</dt>
                    <dd>{details.bonus}</dd>
                </div>
            )}
            {details.annual_leave_days !== null && (
                <div>
                    <dt>Annual Leave</dt>
                    <dd>{details.annual_leave_days} days</dd>
                </div>
            )}
            {details.work_arrangement !== '' && (
                <div>
                    <dt>Work Arrangement</dt>
                    <dd>{details.work_arrangement}</dd>
                </div>
            )}
            {details.pros !== '' && (
                <div>
                    <dt>Pros</dt>
                    <dd>{details.pros}</dd>
                </div>
            )}
            {details.concerns !== '' && (
                <div>
                    <dt>Cons</dt>
                    <dd>{details.concerns}</dd>
                </div>
            )}
        </dl>
    </div>
);

const OfferEvaluationCard = ({
    allowDelete,
    allowEdit,
    application,
    draft,
    errors,
    expanded,
    expired,
    isDeleting,
    isSaving,
    onCancel,
    onDelete,
    onDetailsChange,
    onEdit,
    onRatingChange,
    onSave,
    onStart,
    onToggleExpanded,
}: OfferEvaluationCardProps) => {
    const decisionDeadlineInputRef = useRef<HTMLInputElement>(null);
    const currencyInputRef = useRef<HTMLInputElement>(null);
    const monthlyBaseSalaryInputRef = useRef<HTMLInputElement>(null);
    const bonusInputRef = useRef<HTMLInputElement>(null);
    const annualLeaveInputRef = useRef<HTMLInputElement>(null);
    const workArrangementSelectRef = useRef<HTMLSelectElement>(null);
    const prosTextareaRef = useRef<HTMLTextAreaElement>(null);
    const concernsTextareaRef = useRef<HTMLTextAreaElement>(null);
    const fieldRefs: OfferFieldRefs = {
        decision_deadline: decisionDeadlineInputRef,
        currency: currencyInputRef,
        monthly_base_salary: monthlyBaseSalaryInputRef,
        bonus: bonusInputRef,
        annual_leave_days: annualLeaveInputRef,
        work_arrangement: workArrangementSelectRef,
        pros: prosTextareaRef,
        concerns: concernsTextareaRef,
    };
    const savedEvaluation = application.evaluation;
    const evaluation = draft ?? savedEvaluation;
    const editing = Boolean(draft);
    const submitEvaluation = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSave(Boolean(decisionDeadlineInputRef.current?.validity.badInput), fieldRefs);
    };

    return (
        <article aria-label={`${application.company_name} ${application.job_title}`} className={styles.evaluationCard}>
            <header className={styles.cardHeader}>
                <div>
                    <h3>{application.company_name}</h3>
                    <p>{application.job_title}</p>
                </div>
                <div className={styles.badges}>
                    {expired && <span className={styles.expiredBadge}>Expired</span>}
                    <ApplicationStatusBadge compact jobStatus={application.job_status} />
                </div>
            </header>

            {!evaluation ? (
                <div className={styles.startEvaluation}>
                    <p>Add the offer terms and ratings when you are ready to compare it.</p>
                    <PrimaryButton
                        aria-label={`Add evaluation for ${application.company_name}`}
                        onClick={onStart}
                        type='button'
                        variant='compact'
                    >
                        Add evaluation
                    </PrimaryButton>
                </div>
            ) : (
                <>
                    {!editing && <DecisionDeadlineSummary deadline={evaluation.details.decision_deadline} />}
                    <DecisionScore
                        companyName={application.company_name}
                        score={calculateOfferDecisionScore(evaluation.ratings)}
                    />
                    {editing ? (
                        <form noValidate onSubmit={submitEvaluation}>
                            <fieldset className={styles.detailsFields}>
                                <legend>Decision timing</legend>
                                <label className={styles.textField} htmlFor={`decision-deadline-${application.job_id}`}>
                                    <span>Decision deadline</span>
                                    <input
                                        ref={decisionDeadlineInputRef}
                                        {...getErrorProps(
                                            `decision-deadline-error-${application.job_id}`,
                                            errors.decision_deadline
                                        )}
                                        aria-label={`${application.company_name} decision deadline`}
                                        id={`decision-deadline-${application.job_id}`}
                                        max={MAX_DATETIME_LOCAL}
                                        min={
                                            toDatetimeLocalInputValue(application.application_date) ||
                                            MIN_DATETIME_LOCAL
                                        }
                                        onChange={(event) =>
                                            onDetailsChange(
                                                { ...evaluation.details, decision_deadline: event.target.value },
                                                'decision_deadline'
                                            )
                                        }
                                        required
                                        type='datetime-local'
                                        value={evaluation.details.decision_deadline}
                                    />
                                    <FieldError
                                        id={`decision-deadline-error-${application.job_id}`}
                                        message={errors.decision_deadline}
                                    />
                                </label>
                            </fieldset>
                            <CompensationFields
                                application={application}
                                details={evaluation.details}
                                errors={errors}
                                fieldRefs={fieldRefs}
                                onChange={onDetailsChange}
                            />
                            <RatingFields
                                application={application}
                                error={errors.ratings}
                                evaluation={evaluation}
                                onChange={onRatingChange}
                            />
                            <div className={styles.cardActions}>
                                <PrimaryButton
                                    aria-label={`Cancel evaluation for ${application.company_name}`}
                                    disabled={isSaving}
                                    onClick={onCancel}
                                    type='button'
                                    variant='secondary'
                                >
                                    Cancel
                                </PrimaryButton>
                                <PrimaryButton
                                    aria-label={`Save evaluation for ${application.company_name}`}
                                    isLoading={isSaving}
                                    type='submit'
                                >
                                    Save evaluation
                                </PrimaryButton>
                            </div>
                        </form>
                    ) : (
                        <>
                            {expanded && (
                                <>
                                    <OfferRatingsReview ratings={evaluation.ratings} />
                                    <OfferDetailsReview details={evaluation.details} />
                                </>
                            )}
                            <div className={styles.cardActions}>
                                <PrimaryButton
                                    aria-label={`${expanded ? 'Hide' : 'Show'} details for ${application.company_name}`}
                                    onClick={onToggleExpanded}
                                    type='button'
                                    variant='secondary'
                                >
                                    {expanded ? 'Hide details' : 'Show details'}
                                </PrimaryButton>
                                {allowEdit && (
                                    <PrimaryButton
                                        aria-label={`Edit evaluation for ${application.company_name}`}
                                        onClick={onEdit}
                                        type='button'
                                        variant='compact'
                                    >
                                        Edit evaluation
                                    </PrimaryButton>
                                )}
                                {savedEvaluation && allowDelete && onDelete && (
                                    <PrimaryButton
                                        aria-label={`Delete evaluation for ${application.company_name}`}
                                        isLoading={isDeleting}
                                        onClick={onDelete}
                                        type='button'
                                        variant='destructive'
                                    >
                                        Delete evaluation
                                    </PrimaryButton>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </article>
    );
};

const EvaluationGrid = ({ children, count }: { children: ReactNode; count: number }) => (
    <div className={styles.evaluationGrid} data-card-count={getCardCount(count)} data-testid='offer-evaluation-grid'>
        {children}
    </div>
);

const ComparisonSection = ({ applications, description, heading, id, renderCard }: ComparisonSectionProps) =>
    applications.length > 0 ? (
        <section aria-labelledby={id} className={styles.comparisonSection}>
            <div className={styles.sectionHeading}>
                <h2 id={id}>{heading}</h2>
                <p>{description}</p>
            </div>
            <EvaluationGrid count={applications.length}>{applications.map(renderCard)}</EvaluationGrid>
        </section>
    ) : null;

const OfferDecisionWorkspace = ({ data, onDelete, onSave, readOnly }: OfferDecisionWorkspaceProps) => {
    const confirm = useConfirm();
    const [drafts, setDrafts] = useState<DraftEvaluations>({});
    const [errors, setErrors] = useState<EvaluationErrors>({});
    const [expandedJobIds, setExpandedJobIds] = useState<number[]>([]);
    const [savingJobId, setSavingJobId] = useState<number>();
    const [deletingJobId, setDeletingJobId] = useState<number>();

    const currentOffers = data.applications.filter((application) => application.job_status === 'Offer');
    const offersToEvaluate = currentOffers.filter((application) => !application.evaluation);
    const currentEvaluations = currentOffers.filter((application) => Boolean(application.evaluation));
    const evaluatedOffers = sortEvaluatedOffers(
        currentEvaluations.filter(
            (application) => !isOfferDecisionDeadlineExpired(application.evaluation?.details.decision_deadline ?? '')
        )
    );
    const expiredEvaluatedOffers = sortEvaluatedOffers(
        currentEvaluations.filter((application) =>
            isOfferDecisionDeadlineExpired(application.evaluation?.details.decision_deadline ?? '')
        )
    );
    const previousEvaluations = sortPreviousOfferEvaluations(
        data.applications.filter((application) => application.job_status !== 'Offer' && application.evaluation)
    );

    const clearFieldError = (jobId: number, field: keyof OfferEvaluationFormErrors) => {
        setErrors((current) => {
            const jobErrors = current[jobId];
            return jobErrors?.[field] ? { ...current, [jobId]: { ...jobErrors, [field]: undefined } } : current;
        });
    };

    const startEvaluation = (application: OfferDecisionApplication) => {
        setDrafts((current) => ({
            ...current,
            [application.job_id]: createDefaultOfferEvaluation(application.job_id),
        }));
        setErrors((current) => removeRecordValue(current, application.job_id));
    };

    const editEvaluation = (application: OfferDecisionApplication) => {
        const evaluation = application.evaluation;
        if (readOnly || !evaluation) {
            return;
        }

        setDrafts((current) => ({ ...current, [application.job_id]: cloneEvaluation(evaluation) }));
        setErrors((current) => removeRecordValue(current, application.job_id));
    };

    const cancelEvaluation = (jobId: number) => {
        setDrafts((current) => removeRecordValue(current, jobId));
        setErrors((current) => removeRecordValue(current, jobId));
    };

    const updateEvaluation = (jobId: number, update: (evaluation: OfferEvaluation) => OfferEvaluation) => {
        setDrafts((current) => {
            const evaluation = current[jobId];
            return evaluation ? { ...current, [jobId]: update(evaluation) } : current;
        });
    };

    const handleSave = async (
        application: OfferDecisionApplication,
        decisionDeadlineHasBadInput: boolean,
        fieldRefs: OfferFieldRefs
    ) => {
        const draft = drafts[application.job_id];
        if (!draft || !onSave || savingJobId !== undefined) {
            return;
        }
        const validation = validateOfferEvaluation(
            { ratings: draft.ratings, details: draft.details },
            application.application_date,
            decisionDeadlineHasBadInput
        );
        if (!validation.isValid) {
            setErrors((current) => ({ ...current, [application.job_id]: validation.errors }));
            focusFirstInvalidField(validation.errors, [
                ['decision_deadline', fieldRefs.decision_deadline],
                ['currency', fieldRefs.currency],
                ['monthly_base_salary', fieldRefs.monthly_base_salary],
                ['bonus', fieldRefs.bonus],
                ['annual_leave_days', fieldRefs.annual_leave_days],
                ['work_arrangement', fieldRefs.work_arrangement],
                ['pros', fieldRefs.pros],
                ['concerns', fieldRefs.concerns],
            ]);
            return;
        }
        if (application.evaluation && offerEvaluationsAreEqual(draft, application.evaluation)) {
            cancelEvaluation(application.job_id);
            return;
        }

        setSavingJobId(application.job_id);
        try {
            await onSave(application.job_id, validation.values);
            cancelEvaluation(application.job_id);
            setExpandedJobIds((current) =>
                current.includes(application.job_id) ? current : [...current, application.job_id]
            );
        } catch {
            // The page-level adapter owns user-facing API error handling.
        } finally {
            setSavingJobId(undefined);
        }
    };

    const handleDelete = async (jobId: number) => {
        if (!onDelete || drafts[jobId] || deletingJobId !== undefined) {
            return;
        }
        const { confirmed } = await confirm(createDeleteConfirmation('offer evaluation'));
        if (!confirmed) {
            return;
        }
        setDeletingJobId(jobId);
        try {
            await onDelete(jobId);
            setExpandedJobIds((current) => current.filter((currentJobId) => currentJobId !== jobId));
        } catch {
            // The page-level adapter owns user-facing API error handling.
        } finally {
            setDeletingJobId(undefined);
        }
    };

    const renderCard = (
        application: OfferDecisionApplication,
        allowEdit: boolean,
        expired: boolean,
        showExpiredBadge: boolean
    ) => (
        <OfferEvaluationCard
            allowDelete={Boolean(onDelete)}
            allowEdit={allowEdit}
            application={application}
            draft={drafts[application.job_id]}
            errors={errors[application.job_id] ?? {}}
            expanded={expandedJobIds.includes(application.job_id)}
            expired={showExpiredBadge && expired}
            isDeleting={deletingJobId === application.job_id}
            isSaving={savingJobId === application.job_id}
            key={application.job_id}
            onCancel={() => cancelEvaluation(application.job_id)}
            onDelete={onDelete ? () => void handleDelete(application.job_id) : undefined}
            onDetailsChange={(details, field) => {
                updateEvaluation(application.job_id, (evaluation) => ({ ...evaluation, details }));
                clearFieldError(application.job_id, field);
            }}
            onEdit={() => editEvaluation(application)}
            onRatingChange={(category, value) => {
                updateEvaluation(application.job_id, (evaluation) => ({
                    ...evaluation,
                    ratings: updateOfferDecisionValue(evaluation.ratings, category, value),
                }));
                clearFieldError(application.job_id, 'ratings');
            }}
            onSave={(badInput, refs) => void handleSave(application, badInput, refs)}
            onStart={() => startEvaluation(application)}
            onToggleExpanded={() =>
                setExpandedJobIds((current) =>
                    current.includes(application.job_id)
                        ? current.filter((jobId) => jobId !== application.job_id)
                        : [...current, application.job_id]
                )
            }
        />
    );

    return (
        <main className={styles.workspace}>
            {data.applications.length === 0 ? (
                <EmptyState
                    description={
                        readOnly
                            ? 'Saved evaluations appear here after their applications are archived.'
                            : 'Applications with Offer status appear here, along with saved evaluations that later move to Accepted or Declined.'
                    }
                    followsControls
                    icon='briefcase'
                    title={readOnly ? 'No archived offer comparisons' : 'No offers to compare'}
                />
            ) : readOnly ? (
                <>
                    <ComparisonSection
                        applications={evaluatedOffers}
                        description='Saved evaluations for archived applications with an active decision window.'
                        heading='Archived evaluated offers'
                        id='archived-evaluated-offers-heading'
                        renderCard={(application) => renderCard(application, false, false, false)}
                    />
                    <ComparisonSection
                        applications={expiredEvaluatedOffers}
                        description='Archived offers whose decision deadlines have passed.'
                        heading='Archived expired evaluated offers'
                        id='archived-expired-evaluated-offers-heading'
                        renderCard={(application) => renderCard(application, false, true, true)}
                    />
                    <ComparisonSection
                        applications={previousEvaluations}
                        description='Archived evaluations for applications that left Offer status.'
                        heading='Archived previous evaluations'
                        id='archived-previous-evaluations-heading'
                        renderCard={(application) => renderCard(application, false, false, false)}
                    />
                </>
            ) : (
                <>
                    <ComparisonSection
                        applications={offersToEvaluate}
                        description='Start an evaluation when you are ready. It moves after the first successful save.'
                        heading='Offers to evaluate'
                        id='offers-to-evaluate-heading'
                        renderCard={(application) => renderCard(application, true, false, false)}
                    />
                    <ComparisonSection
                        applications={evaluatedOffers}
                        description='Sorted by the nearest decision deadline, then fit rating.'
                        heading='Evaluated offers'
                        id='evaluated-offers-heading'
                        renderCard={(application) => renderCard(application, true, false, false)}
                    />
                    <ComparisonSection
                        applications={expiredEvaluatedOffers}
                        description='The decision deadline has passed. Update the evaluation if the offer is still open.'
                        heading='Expired evaluated offers'
                        id='expired-evaluated-offers-heading'
                        renderCard={(application) => renderCard(application, true, true, true)}
                    />
                    <ComparisonSection
                        applications={previousEvaluations}
                        description='These records stay read-only after the application leaves Offer status.'
                        heading='Previous evaluations'
                        id='previous-evaluations-heading'
                        renderCard={(application) => renderCard(application, false, false, false)}
                    />
                </>
            )}
        </main>
    );
};

export default OfferDecisionWorkspace;
