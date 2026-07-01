import Icon from '../icon/Icon';
import styles from './AuthRequestInfo.module.css';

const AuthRequestInfo = () => {
    return (
        <div className={styles.cardMeta}>
            <p className={styles.trustMessage}>
                <Icon name='lock' />
                <span>Your applications are private and accessible only from your account.</span>
            </p>
        </div>
    );
};

export default AuthRequestInfo;
