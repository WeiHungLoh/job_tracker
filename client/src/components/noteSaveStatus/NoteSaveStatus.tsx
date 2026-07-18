import type { NoteSaveStatus as NoteSaveStatusValue } from '../../hooks/useAutosaveNotes';
import styles from './NoteSaveStatus.module.css';

type NoteSaveStatusProps = {
    applicationName: string;
    onRetry: () => void;
    status: NoteSaveStatusValue;
};

const NoteSaveStatus = ({ applicationName, onRetry, status }: NoteSaveStatusProps) => {
    if (status === 'idle') {
        return null;
    }

    const statusClassName = status === 'saving' ? styles.saving : status === 'saved' ? styles.saved : styles.error;

    return (
        <div
            aria-atomic='true'
            aria-live={status === 'error' ? 'assertive' : 'polite'}
            className={`${styles.status} ${statusClassName}`}
            role={status === 'error' ? 'alert' : 'status'}
        >
            {status === 'saving' && 'Saving…'}
            {status === 'saved' && 'Saved'}
            {status === 'error' && (
                <>
                    <span>Couldn’t save</span>
                    <span aria-hidden='true'> — </span>
                    <button
                        aria-label={`Retry saving notes for ${applicationName}`}
                        className={styles.retry}
                        onClick={onRetry}
                        type='button'
                    >
                        Retry
                    </button>
                </>
            )}
        </div>
    );
};

export default NoteSaveStatus;
