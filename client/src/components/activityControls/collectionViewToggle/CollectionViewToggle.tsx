import type { CollectionViewMode, CollectionViewToggleProps } from './models';
import styles from './CollectionViewToggle.module.css';

const VIEW_MODE_LABEL: Record<CollectionViewMode, string> = {
    board: 'Board',
    list: 'List',
};

const VIEW_MODES: readonly CollectionViewMode[] = ['list', 'board'];

const CollectionViewToggle = ({ ariaLabel, currentView, onViewChange }: CollectionViewToggleProps) => (
    <div className={styles.toggleWrapper}>
        <div aria-label={ariaLabel} className={styles.toggle} role='group'>
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

export default CollectionViewToggle;
