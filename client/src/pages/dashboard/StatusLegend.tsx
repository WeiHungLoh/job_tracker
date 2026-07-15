import type { JobStatus } from '../application/models';
import type { DashboardStatusSelectHandler } from './models';
import styles from './StatusLegend.module.css';

type StatusLegendProps = {
    label: string;
    statuses: readonly JobStatus[];
    onStatusSelect?: DashboardStatusSelectHandler;
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

const StatusLegend = ({ label, statuses, onStatusSelect }: StatusLegendProps) => {
    return (
        <ul className={styles.legend} aria-label={label}>
            {statuses.map((status) => (
                <li key={status}>
                    {onStatusSelect ? (
                        <button
                            aria-label={`View ${status} applications`}
                            className={styles.statusButton}
                            onClick={() => onStatusSelect(status)}
                            type='button'
                        >
                            <span className={`${styles.swatch} ${statusClassNames[status]}`} aria-hidden='true' />
                            {status}
                        </button>
                    ) : (
                        <>
                            <span className={`${styles.swatch} ${statusClassNames[status]}`} aria-hidden='true' />
                            {status}
                        </>
                    )}
                </li>
            ))}
        </ul>
    );
};

export default StatusLegend;
