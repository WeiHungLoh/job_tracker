import { useDroppable } from '@dnd-kit/core';
import type { CSSProperties } from 'react';
import type { ApplicationBoardColumnProps, BoardColumnContentProps } from './models';
import { getApplicationBoardStatusColor } from './statusClassNames';
import styles from './ApplicationBoard.module.css';

const getColumnStyle = (status: BoardColumnContentProps['status']) =>
    ({
        '--boardStatusColor': getApplicationBoardStatusColor(status),
    } as CSSProperties);

const BoardColumnContent = ({ applications, children, status }: BoardColumnContentProps) => (
    <>
        <h2 className={styles.columnHeading} id={`application-board-column-${status}`}>
            <span className={styles.columnTitle}>{status}</span>{' '}
            <span className={styles.columnCount}>{applications.length}</span>
        </h2>
        <div className={styles.columnCards}>
            {children}
            {applications.length === 0 && <p className={styles.emptyColumn}>No applications</p>}
        </div>
    </>
);

const DroppableApplicationBoardColumn = ({
    applications,
    children,
    isDropDisabled = false,
    status,
}: BoardColumnContentProps & Pick<ApplicationBoardColumnProps, 'isDropDisabled'>) => {
    const { isOver, setNodeRef } = useDroppable({ disabled: isDropDisabled, id: status });
    const columnClassName = [
        styles.column,
        isOver && !isDropDisabled ? styles.dropTarget : '',
        isDropDisabled ? styles.dropDisabled : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section
            aria-disabled={isDropDisabled || undefined}
            aria-labelledby={`application-board-column-${status}`}
            className={columnClassName}
            ref={setNodeRef}
            style={getColumnStyle(status)}
        >
            <BoardColumnContent applications={applications} status={status}>
                {children}
            </BoardColumnContent>
        </section>
    );
};

const ApplicationBoardColumn = ({
    applications,
    children,
    droppable = true,
    isDropDisabled = false,
    status,
}: ApplicationBoardColumnProps) => {
    if (droppable) {
        return (
            <DroppableApplicationBoardColumn
                applications={applications}
                isDropDisabled={isDropDisabled}
                status={status}
            >
                {children}
            </DroppableApplicationBoardColumn>
        );
    }

    return (
        <section
            aria-labelledby={`application-board-column-${status}`}
            className={styles.column}
            style={getColumnStyle(status)}
        >
            <BoardColumnContent applications={applications} status={status}>
                {children}
            </BoardColumnContent>
        </section>
    );
};

export default ApplicationBoardColumn;
