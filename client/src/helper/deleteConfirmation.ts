import type { ConfirmOptions } from 'material-ui-confirm';

export const createDeleteConfirmation = (target: string): ConfirmOptions => {
    const options: ConfirmOptions = {
        title: 'Confirm Deletion',
        description: `Are you sure you want to delete this ${target}? This action is permanent and cannot be undone.`,
        confirmationText: 'Delete',
        cancellationText: 'Cancel',
        confirmationButtonProps: { autoFocus: true },
    };

    return options;
};
