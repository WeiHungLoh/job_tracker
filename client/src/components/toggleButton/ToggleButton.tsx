import type { ToggleButtonProps } from './models';
import styles from './ToggleButton.module.css';

const ToggleButton = ({ toggled, onToggle, label }: ToggleButtonProps) => (
    <div className={styles.toggleButton}>
        <button aria-pressed={toggled} className={styles.row} onClick={onToggle} type='button'>
            <span aria-hidden='true' className={`${styles.switch} ${toggled ? styles.toggled : ''}`}>
                <span className={styles.thumb} />
            </span>
            <span>{label}</span>
        </button>
    </div>
);

export default ToggleButton;
