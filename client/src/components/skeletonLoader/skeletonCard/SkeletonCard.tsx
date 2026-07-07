import type { SkeletonCardProps } from './models';
import styles from './SkeletonCard.module.css';

const ACTION_COUNT: Record<SkeletonCardProps['variant'], number> = {
    application: 2,
    interview: 1,
};

const SkeletonCard = ({ variant }: SkeletonCardProps) => {
    const actionCount = ACTION_COUNT[variant];
    const actionClasses = `${styles.actions} ${variant === 'interview' ? styles.singleAction : ''}`;

    return (
        <div
            className={styles.skeletonCard}
            role='status'
            aria-busy='true'
            aria-label='Loading results'
            data-testid='skeleton-card'
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
