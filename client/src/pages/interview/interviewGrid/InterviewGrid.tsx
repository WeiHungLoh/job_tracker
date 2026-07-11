import type { PropsWithChildren } from 'react';
import type { ApplicationViewMode } from '../../../components/activityControls/applicationViewToggle/models';
import styles from './InterviewGrid.module.css';

type InterviewGridProps = PropsWithChildren<{
    ariaLabel: string;
    layout: ApplicationViewMode;
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
