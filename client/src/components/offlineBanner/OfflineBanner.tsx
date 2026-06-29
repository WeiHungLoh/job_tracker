import { useEffect, useState } from 'react';
import Icon from '../icon/Icon';
import styles from './OfflineBanner.module.css';

const OfflineBanner = () => {
    const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) {
        return null;
    }

    return (
        <div className={styles.banner} data-notification='offline' role='status' aria-live='polite'>
            <span className={styles.signal}>
                <Icon name='wifiOff' />
            </span>
            <span className={styles.copy}>
                <strong className={styles.title}>Connection paused</strong>
                <span className={styles.message}>You’re offline. Reconnect to continue.</span>
            </span>
        </div>
    );
};

export default OfflineBanner;
