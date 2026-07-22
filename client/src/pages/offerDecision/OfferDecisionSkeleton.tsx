import styles from './OfferDecisionSkeleton.module.css';

type OfferDecisionSkeletonProps = {
    announceLoading?: boolean;
};

const OfferDecisionSkeleton = ({ announceLoading = true }: OfferDecisionSkeletonProps) => (
    <div
        aria-busy={announceLoading || undefined}
        aria-hidden={!announceLoading || undefined}
        aria-label={announceLoading ? 'Loading offer comparisons' : undefined}
        className={styles.skeletonCard}
        data-testid='offer-decision-skeleton'
        role={announceLoading ? 'status' : undefined}
    >
        <div className={styles.header}>
            <div className={styles.headingLines}>
                <span className={`${styles.line} ${styles.title}`} />
                <span className={`${styles.line} ${styles.subtitle}`} />
            </div>
            <span className={`${styles.line} ${styles.badge}`} />
        </div>
        <div className={styles.summary}>
            <span className={`${styles.line} ${styles.label}`} />
            <span className={`${styles.line} ${styles.value}`} />
        </div>
        <div className={styles.score}>
            <span className={`${styles.line} ${styles.scoreLabel}`} />
            <span className={`${styles.line} ${styles.progress}`} />
        </div>
        <div className={styles.actions}>
            <span className={`${styles.line} ${styles.button}`} />
            <span className={`${styles.line} ${styles.button}`} />
        </div>
    </div>
);

export default OfferDecisionSkeleton;
