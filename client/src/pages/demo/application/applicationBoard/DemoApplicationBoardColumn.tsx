import { useDroppable } from '@dnd-kit/core';
import type { CSSProperties, ReactNode } from 'react';
import { getApplicationBoardStatusColor } from '../../../application/applicationBoard/statusClassNames';
import type { JobStatus } from '../../../application/models';
import styles from './DemoApplicationBoard.module.css';

type DemoApplicationBoardColumnProps<TApplication> = {
    applications: TApplication[];
    children: ReactNode;
    droppable?: boolean;
    isDropDisabled?: boolean;
    status: JobStatus;
};

const getColumnStyle = (status: JobStatus) =>
    ({
        '--boardStatusColor': getApplicationBoardStatusColor(status),
    } as CSSProperties);

const DemoApplicationBoardColumn = <TApplication,>({
    applications,
    children,
    droppable = true,
    isDropDisabled = false,
    status,
}: DemoApplicationBoardColumnProps<TApplication>) => {
    const { isOver, setNodeRef } = useDroppable({ disabled: !droppable || isDropDisabled, id: status });
    const columnClassName = [
        styles.column,
        droppable && isOver && !isDropDisabled ? styles.dropTarget : '',
        droppable && isDropDisabled ? styles.dropDisabled : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section
            aria-disabled={(droppable && isDropDisabled) || undefined}
            aria-labelledby={`demo-application-board-column-${status}`}
            className={columnClassName}
            ref={droppable ? setNodeRef : undefined}
            style={getColumnStyle(status)}
        >
            <h2 className={styles.columnHeading} id={`demo-application-board-column-${status}`}>
                <span className={styles.columnTitle}>{status}</span>{' '}
                <span className={styles.columnCount}>{applications.length}</span>
            </h2>
            <div className={styles.columnCards}>
                {children}
                {applications.length === 0 && <p className={styles.emptyColumn}>No applications</p>}
            </div>
        </section>
    );
};

export default DemoApplicationBoardColumn;
