import styles from './SkeletonBoard.module.css';

const SKELETON_COLUMN_COUNT = 4;
const SKELETON_CARD_COUNT = 3;

const SkeletonBoard = () => (
    <div aria-busy='true' aria-label='Loading board' className={styles.skeletonBoard} role='status'>
        {Array.from({ length: SKELETON_COLUMN_COUNT }, (_, columnIndex) => (
            <section className={styles.skeletonColumn} data-testid='skeleton-board-column' key={columnIndex}>
                <div className={`${styles.skeletonLine} ${styles.skeletonColumnHeading}`} />
                <div className={styles.skeletonCards}>
                    {Array.from({ length: SKELETON_CARD_COUNT }, (_, cardIndex) => (
                        <div className={styles.skeletonCardPreview} key={cardIndex}>
                            <div className={`${styles.skeletonLine} ${styles.skeletonCardTitle}`} />
                            <div className={`${styles.skeletonLine} ${styles.skeletonCardLine}`} />
                            <div className={`${styles.skeletonLine} ${styles.skeletonCardShortLine}`} />
                        </div>
                    ))}
                </div>
            </section>
        ))}
    </div>
);

export default SkeletonBoard;
