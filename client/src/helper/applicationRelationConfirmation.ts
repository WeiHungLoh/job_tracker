import type { ConfirmOptions } from 'material-ui-confirm';
import { formatCountLabel, PERMANENT_DELETION_WARNING, type ApplicationCollectionState } from './bulkConfirmation';

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
    state: ApplicationCollectionState,
    relatedInterviewCount: number
): ConfirmOptions => {
    const actionLabel = ACTION_LABELS[action];
    const relatedInterviews =
        relatedInterviewCount > 0
            ? ` and its ${formatCountLabel(relatedInterviewCount, `related ${state} interview`)}`
            : '';
    const permanence = action === 'delete' ? ` ${PERMANENT_DELETION_WARNING}` : '';

    return {
        title: CONFIRMATION_TITLES[action],
        description: `${actionLabel} this ${state} job application${relatedInterviews}?${permanence}`,
        confirmationText: actionLabel,
        cancellationText: 'Cancel',
        confirmationButtonProps: { autoFocus: true },
    };
};
