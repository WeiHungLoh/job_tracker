import type { ToggleButtonProps } from './models';
import styles from './ToggleButton.module.css';

const ToggleButton = ({ toggled, onToggle, label, toggledLabel, color = 'green', ...props }: ToggleButtonProps) => (
    <div className={styles.toggleButton} {...props}>
        <div>{toggled ? toggledLabel : label}</div>
        <button type='button' className={`${styles.switch} ${toggled ? styles[color] : ''}`} onClick={onToggle}>
            <div className={styles.thumb} />
        </button>
    </div>
);

export default ToggleButton;
