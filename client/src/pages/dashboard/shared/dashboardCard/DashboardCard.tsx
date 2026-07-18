import { useId, type ReactNode } from 'react';
import styles from './DashboardCard.module.css';

type DashboardCardProps = {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
};

const DashboardCard = ({ title, description, children, className = '' }: DashboardCardProps) => {
    const titleId = useId();
    const classes = [styles.card, className].filter(Boolean).join(' ');

    return (
        <article className={classes} aria-labelledby={titleId}>
            <header className={styles.header}>
                <h2 id={titleId}>{title}</h2>
                {description && <p>{description}</p>}
            </header>
            <div className={styles.content}>{children}</div>
        </article>
    );
};

export default DashboardCard;
