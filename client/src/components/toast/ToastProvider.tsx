import {
    type PropsWithChildren,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ToastContextValue, ToastMessage, ToastType } from './models';
import ToastContainer from './ToastContainer';
import OfflineBanner from '../offlineBanner/OfflineBanner';
import styles from './ToastProvider.module.css';

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const ERROR_TOAST_DURATION_MS = 8000;
const SUCCESS_TOAST_DURATION_MS = 3000;

export const ToastProvider = ({ children }: PropsWithChildren) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const nextToastId = useRef(0);
    const toastTimeouts = useRef(new Map<number, number>());

    const dismissToast = useCallback((id: number) => {
        const timeout = toastTimeouts.current.get(id);
        if (timeout !== undefined) {
            window.clearTimeout(timeout);
            toastTimeouts.current.delete(id);
        }
        setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (message: string, type: ToastType) => {
            nextToastId.current += 1;
            const id = nextToastId.current;

            setToasts((currentToasts) => [...currentToasts, { id, message, type }]);
            const duration = type === 'success' ? SUCCESS_TOAST_DURATION_MS : ERROR_TOAST_DURATION_MS;
            const timeout = window.setTimeout(() => dismissToast(id), duration);
            toastTimeouts.current.set(id, timeout);
        },
        [dismissToast]
    );

    useEffect(() => {
        const timeouts = toastTimeouts.current;

        return () => {
            timeouts.forEach((timeout) => window.clearTimeout(timeout));
            timeouts.clear();
        };
    }, []);

    const contextValue = useMemo<ToastContextValue>(
        () => ({
            showErrorToast: (message) => showToast(message, 'error'),
            showSuccessToast: (message) => showToast(message, 'success'),
        }),
        [showToast]
    );

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className={styles.notificationStack}>
                <OfflineBanner />
                <ToastContainer onDismiss={dismissToast} toasts={toasts} />
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
};
