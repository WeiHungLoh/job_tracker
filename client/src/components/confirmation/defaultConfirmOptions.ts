import type { ConfirmOptions } from 'material-ui-confirm';

export const defaultConfirmOptions: ConfirmOptions = {
    confirmationButtonProps: {
        color: 'primary',
        variant: 'contained',
    },
    cancellationButtonProps: {
        color: 'primary',
        variant: 'outlined',
    },
};
