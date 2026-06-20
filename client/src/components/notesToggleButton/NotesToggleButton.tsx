import type { NotesToggleButtonProps } from './models';
import styles from './NotesToggleButton.module.css';

const NotesToggleButton = ({ toggled, onToggle }: NotesToggleButtonProps) => {
    const buttonMessage = (toggled: boolean) => {
        return toggled ? 'Hide Notes' : 'Unhide Notes';
    };

    return (
        <div className={styles.notesToggleButton}>
            <div>{buttonMessage(toggled)}</div>
            <button className={`${styles.toggleButton} ${toggled ? styles.active : ''}`}
                onClick={onToggle}>
                <div className={styles.thumb} />
            </button>
        </div>
    );
};

export default NotesToggleButton;
