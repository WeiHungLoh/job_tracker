import type { PropsWithChildren } from 'react';
import type { CollectionViewMode } from '../../../components/activityControls/collectionViewToggle/models';
import styles from './InterviewGrid.module.css';

type InterviewGridProps = PropsWithChildren<{
    ariaLabel: string;
    layout: CollectionViewMode;
}>;

const InterviewGrid = ({ ariaLabel, children, layout }: InterviewGridProps) => (
    <section
        aria-label={ariaLabel}
        className={`${styles.interviews} ${layout === 'board' ? styles.board : styles.list}`}
        data-layout={layout}
    >
        {children}
    </section>
);

export default InterviewGrid;
