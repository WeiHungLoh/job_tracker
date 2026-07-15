import { Link } from 'react-router-dom';
import { useId } from 'react';
import Icon from '../icon/Icon';
import type { EmptyStateAction, EmptyStateProps } from './models';
import styles from './EmptyState.module.css';

const Action = ({ action, variant }: { action: EmptyStateAction; variant: 'primary' | 'secondary' }) => {
    const className = `${styles.action} ${styles[variant]}`;

    if (action.to) {
        return (
            <Link className={className} onClick={action.onClick} to={action.to}>
                {action.label}
            </Link>
        );
    }

    return (
        <button className={className} onClick={action.onClick} type='button'>
            {action.label}
        </button>
    );
};

const EmptyState = ({
    description,
    followsControls = false,
    icon,
    primaryAction,
    secondaryAction,
    title,
}: EmptyStateProps) => {
    const titleId = useId();
    const className = `${styles.emptyState} ${followsControls ? styles.followsControls : ''}`.trim();

    return (
        <section className={className} aria-labelledby={titleId}>
            {icon && (
                <span className={styles.icon} aria-hidden='true'>
                    <Icon name={icon} />
                </span>
            )}
            <h2 id={titleId}>{title}</h2>
            {description && <p>{description}</p>}
            {(primaryAction || secondaryAction) && (
                <div className={styles.actions}>
                    {primaryAction && <Action action={primaryAction} variant='primary' />}
                    {secondaryAction && <Action action={secondaryAction} variant='secondary' />}
                </div>
            )}
        </section>
    );
};

export default EmptyState;
