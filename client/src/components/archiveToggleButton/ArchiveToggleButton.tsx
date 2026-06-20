import type { ArchiveToggleButtonProps } from './models';
import styles from './ArchiveToggleButton.module.css';

const ArchiveToggleButton = ({ toggled, onToggle }: ArchiveToggleButtonProps) => {
    const buttonMessage = (toggled: boolean) => {
        return toggled ? 'Hide Archive' : 'Unhide Archive';
    };

    return (
        <div className={styles.archiveToggleButton}>
            <div>{buttonMessage(toggled)}</div>
            <button className={`${styles.toggleButton} ${toggled ? styles.active : ''}`} onClick={onToggle}>
                <div className={styles.thumb} />
            </button>
        </div>
    );
};

export default ArchiveToggleButton;
