import { useId, type ReactNode } from 'react';
import styles from './DashboardCard.module.css';

type DashboardCardProps = {
    title: string;
    description?: string;
    children: ReactNode;
};

const DashboardCard = ({ title, description, children }: DashboardCardProps) => {
    const titleId = useId();

    return (
        <article className={styles.card} aria-labelledby={titleId}>
            <header className={styles.header}>
                <h2 id={titleId}>{title}</h2>
                {description && <p>{description}</p>}
            </header>
            <div className={styles.content}>{children}</div>
        </article>
    );
};

export default DashboardCard;
