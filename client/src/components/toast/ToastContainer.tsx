import PrimaryButton from '../button/PrimaryButton';
import type { ToastContainerProps } from './models';
import styles from './ToastContainer.module.css';

const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => {
    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className={styles.toastContainer} data-testid='toast-container'>
            {toasts.map((toast) => (
                <div
                    className={`${styles.toast} ${toast.type === 'error' ? styles.errorToast : styles.successToast}`}
                    data-testid='toast'
                    key={toast.id}
                    role={toast.type === 'error' ? 'alert' : 'status'}
                >
                    <span>{toast.message}</span>
                    <PrimaryButton
                        aria-label='Dismiss notification'
                        className={styles.dismissButton}
                        onClick={() => onDismiss(toast.id)}
                        type='button'
                        variant='icon'
                    >
                        &times;
                    </PrimaryButton>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
