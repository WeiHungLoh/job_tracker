import type { JobStatus } from '../application/models';
import styles from './StatusLegend.module.css';

type StatusLegendProps = {
    label: string;
    statuses: readonly JobStatus[];
};

const statusClassNames: Record<JobStatus, string> = {
    Accepted: styles.accepted,
    Applied: styles.applied,
    Declined: styles.declined,
    Ghosted: styles.ghosted,
    Interview: styles.interview,
    Offer: styles.offer,
    Rejected: styles.rejected,
};

const StatusLegend = ({ label, statuses }: StatusLegendProps) => {
    return (
        <ul className={styles.legend} aria-label={label}>
            {statuses.map((status) => (
                <li key={status}>
                    <span className={`${styles.swatch} ${statusClassNames[status]}`} aria-hidden='true' />
                    {status}
                </li>
            ))}
        </ul>
    );
};

export default StatusLegend;
