import type { ApplicationControlsProps } from './models';
import styles from './ApplicationControls.module.css';

const ApplicationControls = ({ filter, viewOptions }: ApplicationControlsProps) => {
    return (
        <div className={styles.controls}>
            {filter}
            {viewOptions && <div className={styles.viewOptions}>{viewOptions}</div>}
        </div>
    );
};

export default ApplicationControls;
