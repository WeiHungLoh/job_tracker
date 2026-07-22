import type { ConfirmOptions } from 'material-ui-confirm';
import {
    formatCountLabel,
    PERMANENT_DELETION_WARNING,
    type CollectionState,
} from '../../components/confirmation/bulkConfirmations';

export type ApplicationRelationAction = 'archive' | 'delete' | 'unarchive';

const ACTION_LABELS: Record<ApplicationRelationAction, string> = {
    archive: 'Archive',
    delete: 'Delete',
    unarchive: 'Unarchive',
};

const CONFIRMATION_TITLES: Record<ApplicationRelationAction, string> = {
    archive: 'Confirm Archive',
    delete: 'Confirm Deletion',
    unarchive: 'Confirm Unarchive',
};

export const createApplicationRelationConfirmation = (
    action: ApplicationRelationAction,
    state: CollectionState,
    relatedInterviewCount: number,
    offerEvaluationCount = 0
): ConfirmOptions => {
    const actionLabel = ACTION_LABELS[action];
    const relatedInterviewLabel = formatCountLabel(relatedInterviewCount, `related ${state} interview`);
    const relatedInterviews = relatedInterviewCount > 0 ? ` and its ${relatedInterviewLabel}` : '';
    const permanence = action === 'delete' ? ` ${PERMANENT_DELETION_WARNING}` : '';

    if (offerEvaluationCount > 0) {
        const evaluationLabel =
            offerEvaluationCount === 1
                ? 'saved offer evaluation'
                : formatCountLabel(offerEvaluationCount, 'saved offer evaluation');
        const relations = [
            ...(relatedInterviewCount > 0 ? [`its ${relatedInterviewLabel}`] : []),
            `its ${evaluationLabel}`,
        ];
        const relationDescription =
            relations.length === 1 ? ` and ${relations[0]}` : `, ${relations[0]}, and ${relations[1]}`;
        const lifecycle =
            action === 'archive'
                ? ' The saved offer evaluation becomes read-only while archived.'
                : action === 'unarchive'
                ? ' The saved offer evaluation becomes editable again.'
                : permanence;

        return {
            title: CONFIRMATION_TITLES[action],
            description: `${actionLabel} this ${state} job application${relationDescription}?${lifecycle}`,
            confirmationText: actionLabel,
            cancellationText: 'Cancel',
            confirmationButtonProps: { autoFocus: true },
        };
    }

    return {
        title: CONFIRMATION_TITLES[action],
        description: `${actionLabel} this ${state} job application${relatedInterviews}?${permanence}`,
        confirmationText: actionLabel,
        cancellationText: 'Cancel',
        confirmationButtonProps: { autoFocus: true },
    };
};
