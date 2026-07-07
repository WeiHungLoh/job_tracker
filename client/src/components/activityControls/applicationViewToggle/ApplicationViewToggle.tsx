import type { ApplicationViewMode, ApplicationViewToggleProps } from './models';
import styles from './ApplicationViewToggle.module.css';

const VIEW_MODE_LABEL: Record<ApplicationViewMode, string> = {
    board: 'Board',
    list: 'List',
};

const VIEW_MODES: readonly ApplicationViewMode[] = ['list', 'board'];

const ApplicationViewToggle = ({ currentView, onViewChange }: ApplicationViewToggleProps) => (
    <div className={styles.toggleWrapper}>
        <div aria-label='Application view' className={styles.toggle} role='group'>
            {VIEW_MODES.map((viewMode) => (
                <button
                    aria-pressed={currentView === viewMode}
                    className={`${styles.option} ${currentView === viewMode ? styles.active : ''}`}
                    key={viewMode}
                    onClick={() => onViewChange(viewMode)}
                    type='button'
                >
                    {VIEW_MODE_LABEL[viewMode]}
                </button>
            ))}
        </div>
    </div>
);

export default ApplicationViewToggle;
