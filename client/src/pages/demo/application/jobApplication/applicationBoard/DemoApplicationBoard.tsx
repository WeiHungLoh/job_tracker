import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
    type Modifier,
} from '@dnd-kit/core';
import { useCallback, useRef, useState, type UIEvent } from 'react';
import DemoApplicationBoardCard from './DemoApplicationBoardCard';
import DemoApplicationBoardColumn from '../../applicationBoard/DemoApplicationBoardColumn';
import {
    getOrderedBoardStatuses,
    groupApplicationsByStatus,
    isJobStatus,
} from '../../../../application/applicationBoard/applicationBoardUtils';
import type { JobApplication, JobStatus } from '../../../../application/models';
import styles from '../../applicationBoard/DemoApplicationBoard.module.css';
import applicationBoardStyles from '../../../../application/applicationBoard/ApplicationBoard.module.css';

const SCROLL_BOUNDARY_TOLERANCE = 1;

type DemoApplicationBoardProps = {
    applications: JobApplication[];
    deletingApplicationIds: ReadonlySet<number>;
    editedNotes: Record<number, string>;
    hasInterview: (jobId: number) => boolean;
    isArchivingApplication: (jobId: number) => boolean;
    onArchive: (jobId: number) => void | Promise<void>;
    onDelete: (jobId: number) => void | Promise<void>;
    onEditNotes: (jobId: number, notes: string) => void;
    onStatusChange: (application: JobApplication, jobStatus: JobStatus) => void | Promise<void>;
    selectedJobStatuses: readonly JobStatus[];
    upcomingInterviewCountByJob: Record<number, number>;
};

const isApplicationBoardElement = (element: Element) => element.classList.contains(applicationBoardStyles.board);

const getMaxBoardScrollLeft = (board: Element) => Math.max(0, board.scrollWidth - board.clientWidth);

const canAutoScrollBoard = (element: Element) =>
    isApplicationBoardElement(element) && getMaxBoardScrollLeft(element) > 0;

const clampBoardScrollLeft = (board: Element) => {
    const maxScrollLeft = getMaxBoardScrollLeft(board);

    if (board.scrollLeft < 0) {
        board.scrollLeft = 0;
        return;
    }

    if (board.scrollLeft >= maxScrollLeft - SCROLL_BOUNDARY_TOLERANCE) {
        board.scrollLeft = maxScrollLeft;
    }
};

const clampBoardScroll = (event: UIEvent<HTMLDivElement>) => {
    clampBoardScrollLeft(event.currentTarget);
};

const restrictDragToBoardViewport: Modifier = ({
    activeNodeRect,
    scrollableAncestorRects,
    scrollableAncestors,
    transform,
}) => {
    const boardIndex = scrollableAncestors.findIndex(isApplicationBoardElement);
    const boardRect = scrollableAncestorRects[boardIndex];

    if (!activeNodeRect || !boardRect) {
        return transform;
    }

    const minX = boardRect.left - activeNodeRect.left;
    const maxX = boardRect.right - activeNodeRect.right;

    if (maxX < minX) {
        return transform;
    }

    return {
        ...transform,
        x: Math.min(maxX, Math.max(minX, transform.x)),
    };
};

const APPLICATION_BOARD_DRAG_MODIFIERS: Modifier[] = [restrictDragToBoardViewport];

const getDragJobId = (id: DragStartEvent['active']['id']) => {
    const jobId = Number(id);

    return Number.isFinite(jobId) ? jobId : null;
};

const DemoApplicationBoard = ({
    applications,
    deletingApplicationIds,
    editedNotes,
    hasInterview,
    isArchivingApplication,
    onArchive,
    onDelete,
    onEditNotes,
    onStatusChange,
    selectedJobStatuses,
    upcomingInterviewCountByJob,
}: DemoApplicationBoardProps) => {
    const boardRef = useRef<HTMLDivElement>(null);
    const [draggingApplicationId, setDraggingApplicationId] = useState<number | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );
    const groupedApplications = groupApplicationsByStatus(applications);
    const boardStatuses = getOrderedBoardStatuses(selectedJobStatuses);
    const activeApplicationHasInterview = draggingApplicationId !== null && hasInterview(draggingApplicationId);
    const clampCurrentBoardScroll = useCallback(() => {
        if (boardRef.current) {
            clampBoardScrollLeft(boardRef.current);
        }
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        setDraggingApplicationId(getDragJobId(event.active.id));
    };

    const handleDragCancel = () => {
        setDraggingApplicationId(null);
        clampCurrentBoardScroll();
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setDraggingApplicationId(null);
        clampCurrentBoardScroll();

        const destinationStatus = String(event.over?.id ?? '');
        const jobId = getDragJobId(event.active.id);

        if (jobId === null) {
            return;
        }

        const application = applications.find((item) => item.job_id === jobId);

        if (!application || !isJobStatus(destinationStatus) || application.job_status === destinationStatus) {
            return;
        }
        if (destinationStatus === 'Applied' && hasInterview(application.job_id)) {
            return;
        }

        void onStatusChange(application, destinationStatus);
    };

    return (
        <DndContext
            autoScroll={{ canScroll: canAutoScrollBoard }}
            modifiers={APPLICATION_BOARD_DRAG_MODIFIERS}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
            onDragMove={clampCurrentBoardScroll}
            onDragStart={handleDragStart}
            sensors={sensors}
        >
            <div
                aria-label='Application board'
                className={styles.board}
                onScroll={clampBoardScroll}
                ref={boardRef}
                role='region'
            >
                {boardStatuses.map((status) => {
                    const statusApplications = groupedApplications[status];
                    const isDropDisabled = status === 'Applied' && activeApplicationHasInterview;

                    return (
                        <DemoApplicationBoardColumn
                            applications={statusApplications}
                            isDropDisabled={isDropDisabled}
                            key={status}
                            status={status}
                        >
                            {statusApplications.map((application) => (
                                <DemoApplicationBoardCard
                                    application={application}
                                    hasInterview={hasInterview(application.job_id)}
                                    isArchiving={isArchivingApplication(application.job_id)}
                                    isDeleting={deletingApplicationIds.has(application.job_id)}
                                    key={application.job_id}
                                    note={editedNotes[application.job_id] ?? application.notes}
                                    onArchive={onArchive}
                                    onDelete={onDelete}
                                    onEditNotes={onEditNotes}
                                    onStatusChange={onStatusChange}
                                    upcomingInterviewCount={upcomingInterviewCountByJob[application.job_id] ?? 0}
                                />
                            ))}
                        </DemoApplicationBoardColumn>
                    );
                })}
            </div>
        </DndContext>
    );
};

export default DemoApplicationBoard;
