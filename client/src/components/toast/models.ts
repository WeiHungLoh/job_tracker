export type ToastType = 'error' | 'success';

export type ToastMessage = {
    id: number;
    message: string;
    type: ToastType;
};

export type ToastContainerProps = {
    toasts: ToastMessage[];
    onDismiss: (id: number) => void;
};

export type ToastContextValue = {
    showErrorToast: (message: string) => void;
    showSuccessToast: (message: string) => void;
};
