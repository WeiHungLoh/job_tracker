import Icon from '../icon/Icon';
import styles from './AuthRequestInfo.module.css';

type AuthRequestInfoProps = {
    action: 'Sign in' | 'Sign up';
};

const AuthRequestInfo = ({ action }: AuthRequestInfoProps) => {
    return (
        <div className={styles.cardMeta}>
            <p className={styles.trustMessage}>
                <Icon name='lock' />
                <span>Your applications are private and accessible only from your account.</span>
            </p>
            <p className={styles.notice}>
                <span className={styles.noticeIcon}>
                    <Icon name='alert' />
                </span>
                <span>
                    The free-tier server may take up to 50 seconds to wake up. Please wait after clicking {action}
                </span>
            </p>
        </div>
    );
};

export default AuthRequestInfo;
