import type { SkeletonCardProps } from './models';
import styles from './SkeletonCard.module.css';

const ACTION_COUNT: Record<SkeletonCardProps['variant'], number> = {
    application: 2,
    interview: 1,
};

const SkeletonCard = ({ announceLoading = true, layout = 'list', variant }: SkeletonCardProps) => {
    const actionCount = ACTION_COUNT[variant];
    const actionClasses = `${styles.actions} ${variant === 'interview' ? styles.singleAction : ''}`;
    const cardClasses = `${styles.skeletonCard} ${layout === 'board' ? styles.board : ''}`;

    return (
        <div
            aria-busy={announceLoading || undefined}
            aria-hidden={!announceLoading || undefined}
            aria-label={announceLoading ? 'Loading results' : undefined}
            className={cardClasses}
            data-testid='skeleton-card'
            role={announceLoading ? 'status' : undefined}
        >
            <div className={styles.textLines} data-testid='skeleton-text-lines'>
                <div className={`${styles.skeletonLine} ${styles.title}`} />
                <div className={`${styles.skeletonLine} ${styles.long}`} />
                <div className={`${styles.skeletonLine} ${styles.medium}`} />
                <div className={`${styles.skeletonLine} ${styles.wide}`} />
                <div className={`${styles.skeletonLine} ${styles.short}`} />
            </div>
            <div className={actionClasses} data-testid='skeleton-actions'>
                {Array.from({ length: actionCount }, (_, index) => (
                    <div className={`${styles.skeletonLine} ${styles.button}`} key={index} />
                ))}
            </div>
        </div>
    );
};

export default SkeletonCard;
