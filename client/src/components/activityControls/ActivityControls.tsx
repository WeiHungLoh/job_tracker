import type { ActivityControlsProps } from './models';
import styles from './ActivityControls.module.css';

const ActivityControls = ({ children }: ActivityControlsProps) => <div className={styles.controls}>{children}</div>;

export default ActivityControls;
