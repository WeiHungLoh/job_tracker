import type { ConfirmOptions } from 'material-ui-confirm';

export const createDeleteConfirmation = (target: string, deleteAll = false): ConfirmOptions => {
    const targetLabel = deleteAll ? `all ${target}s` : `this ${target}`;

    const options: ConfirmOptions = {
        title: 'Confirm Deletion',
        description: `Are you sure you want to delete ${targetLabel}? This action is permanent and cannot be undone.`,
        confirmationText: deleteAll ? 'Delete All' : 'Delete',
        cancellationText: 'Cancel',
    };

    if (!deleteAll) {
        options.confirmationButtonProps = { autoFocus: true };
    }

    return options;
};
