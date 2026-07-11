import type { ActivityControlsProps } from './models';
import styles from './ActivityControls.module.css';

const ActivityControls = ({ actions, ariaLabel, children }: ActivityControlsProps) => (
    <section aria-label={ariaLabel} className={styles.controls}>
        <div className={styles.primaryControls}>{children}</div>
        {actions && <div className={styles.actions}>{actions}</div>}
    </section>
);

export default ActivityControls;
