import type { KeyboardEvent } from 'react';
import type { ConfirmOptions } from 'material-ui-confirm';

export const formatCountLabel = (count: number, singular: string, plural = `${singular}s`) =>
    `${count} ${count === 1 ? singular : plural}`;

export type ApplicationCollectionState = 'active' | 'archived';

export const PERMANENT_DELETION_WARNING = 'This action is permanent and cannot be undone.';

const preventEnterConfirmation = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
    }
};

const bulkOptions = (title: string, description: string, confirmationText: string): ConfirmOptions => ({
    title,
    description,
    confirmationText,
    cancellationText: 'Cancel',
    confirmationButtonProps: { autoFocus: false, onKeyDown: preventEnterConfirmation },
});

const applicationDescription = (
    action: 'Archive' | 'Delete' | 'Unarchive',
    applicationCount: number,
    interviewCount: number,
    offerEvaluationCount: number,
    state: ApplicationCollectionState
) => {
    const applicationLabel = formatCountLabel(applicationCount, `${state} job application`);
    const interviewLabel = formatCountLabel(interviewCount, `related ${state} interview`);
    const filterLabel = state === 'archived' ? 'archived job-status filters' : 'job-status filters';
    const permanence = action === 'Delete' ? ` ${PERMANENT_DELETION_WARNING}` : '';

    if (offerEvaluationCount > 0) {
        const possessive = applicationCount === 1 ? 'its' : 'their';
        const evaluationLabel = formatCountLabel(offerEvaluationCount, 'saved offer evaluation');
        const lifecycle =
            action === 'Archive'
                ? ' Saved offer evaluations become read-only while archived.'
                : action === 'Unarchive'
                ? ' Saved offer evaluations become editable again.'
                : permanence;

        return `${action} all ${applicationLabel}, ${possessive} ${interviewLabel}, and ${possessive} ${evaluationLabel}? This affects every ${state} application you own, including applications not visible under the current ${filterLabel}.${lifecycle}`;
    }

    return `${action} all ${applicationLabel} and ${
        applicationCount === 1 ? 'its' : 'their'
    } ${interviewLabel}? This affects every ${state} application you own, including applications not visible under the current ${filterLabel}.${permanence}`;
};

export const createArchiveAllConfirmation = (
    applicationCount: number,
    interviewCount: number,
    offerEvaluationCount = 0
): ConfirmOptions =>
    bulkOptions(
        'Confirm Archive All',
        applicationDescription('Archive', applicationCount, interviewCount, offerEvaluationCount, 'active'),
        'Archive All'
    );

export const createUnarchiveAllConfirmation = (
    applicationCount: number,
    interviewCount: number,
    offerEvaluationCount = 0
): ConfirmOptions =>
    bulkOptions(
        'Confirm Unarchive All',
        applicationDescription('Unarchive', applicationCount, interviewCount, offerEvaluationCount, 'archived'),
        'Unarchive All'
    );

export const createDeleteAllApplicationsConfirmation = (
    applicationCount: number,
    interviewCount: number,
    offerEvaluationCount: number,
    state: ApplicationCollectionState
): ConfirmOptions =>
    bulkOptions(
        'Confirm Delete All',
        applicationDescription('Delete', applicationCount, interviewCount, offerEvaluationCount, state),
        'Delete All'
    );

export const createDeleteAllInterviewsConfirmation = (
    interviewCount: number,
    state: ApplicationCollectionState
): ConfirmOptions => {
    const interviewLabel = formatCountLabel(interviewCount, `${state} interview`);

    return bulkOptions(
        'Confirm Delete All',
        `Delete all ${interviewLabel} you own? This affects every ${state} interview in your account. ${PERMANENT_DELETION_WARNING}`,
        'Delete All'
    );
};

export const createDeleteAllOfferEvaluationsConfirmation = (
    evaluationCount: number,
    state: ApplicationCollectionState
): ConfirmOptions => {
    const evaluationLabel = formatCountLabel(evaluationCount, `${state} offer evaluation`);

    return bulkOptions(
        'Confirm Delete All',
        `Delete all ${evaluationLabel} you own? This removes only saved evaluations for ${state} applications. Applications and offers without evaluations are not deleted. ${PERMANENT_DELETION_WARNING}`,
        'Delete All'
    );
};

export const createBulkCalendarExportConfirmation = (interviewCount: number): ConfirmOptions => {
    const interviewLabel = formatCountLabel(interviewCount, 'upcoming interview');

    return bulkOptions(
        'Export all upcoming interviews?',
        `This will download one .ics file containing all ${interviewLabel}, including interviews you may already have added to your calendar. Importing the file again may create duplicate calendar events.`,
        'Export All'
    );
};
