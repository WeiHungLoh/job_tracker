import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import DemoApplicationBoard from '../../pages/demo/application/jobApplication/applicationBoard/DemoApplicationBoard';
import { JOB_STATUSES } from '../../pages/application/models';

const dndState = vi.hoisted(() => ({
    canScroll: undefined as ((element: Element) => boolean) | undefined,
    collisionDetection: undefined as ((args: unknown) => unknown[]) | undefined,
    pointerCollisions: [] as unknown[],
    rectangleCollisions: [] as unknown[],
    sensorOptions: [] as unknown[],
}));

vi.mock('../../pages/demo/application/applicationBoard/DemoApplicationBoard.module.css', () => ({
    default: { board: 'demo-board production-board' },
}));

vi.mock('../../pages/application/applicationBoard/ApplicationBoard.module.css', () => ({
    default: { board: 'production-board' },
}));

vi.mock('@dnd-kit/core', () => ({
    DndContext: ({
        autoScroll,
        children,
        collisionDetection,
    }: {
        autoScroll: { canScroll: (element: Element) => boolean };
        children: ReactNode;
        collisionDetection: (args: unknown) => unknown[];
    }) => {
        dndState.canScroll = autoScroll.canScroll;
        dndState.collisionDetection = collisionDetection;
        return children;
    },
    KeyboardSensor: class KeyboardSensor {},
    PointerSensor: class PointerSensor {},
    pointerWithin: vi.fn(() => dndState.pointerCollisions),
    rectIntersection: vi.fn(() => dndState.rectangleCollisions),
    useSensor: vi.fn((_sensor, options) => {
        dndState.sensorOptions.push(options);
        return {};
    }),
    useSensors: vi.fn(() => []),
}));

vi.mock('../../pages/demo/application/applicationBoard/DemoApplicationBoardColumn', () => ({
    default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('DemoApplicationBoard', () => {
    beforeEach(() => {
        dndState.sensorOptions = [];
    });

    test('allows horizontal auto-scroll while dragging a card', () => {
        render(
            <DemoApplicationBoard
                applications={[]}
                deletingApplicationIds={new Set()}
                editedNotes={{}}
                hasInterview={() => false}
                hasOfferEvaluation={() => false}
                isArchivingApplication={() => false}
                noteSaveStatuses={{}}
                onArchive={vi.fn()}
                onDelete={vi.fn()}
                onEditNotes={vi.fn()}
                onNotesBlur={vi.fn()}
                onNotesVisibilityChange={vi.fn()}
                onRetryNotes={vi.fn()}
                onStatusChange={vi.fn()}
                selectedJobStatuses={JOB_STATUSES}
                upcomingInterviewCountByJob={{}}
            />
        );

        const board = screen.getByRole('region', { name: 'Application board' });
        Object.defineProperties(board, {
            clientWidth: { configurable: true, value: 320 },
            scrollWidth: { configurable: true, value: 960 },
        });

        expect(dndState.canScroll).toBeTypeOf('function');
        expect(dndState.canScroll?.(board)).toBe(true);
        expect(dndState.sensorOptions).toEqual([undefined, undefined]);
    });

    test('uses the pointer drop column with rectangle collision as the keyboard fallback', () => {
        const pointerCollision = { id: 'Interview' };
        const rectangleCollision = { id: 'Declined' };
        dndState.pointerCollisions = [pointerCollision];
        dndState.rectangleCollisions = [rectangleCollision];

        render(
            <DemoApplicationBoard
                applications={[]}
                deletingApplicationIds={new Set()}
                editedNotes={{}}
                hasInterview={() => false}
                hasOfferEvaluation={() => false}
                isArchivingApplication={() => false}
                noteSaveStatuses={{}}
                onArchive={vi.fn()}
                onDelete={vi.fn()}
                onEditNotes={vi.fn()}
                onNotesBlur={vi.fn()}
                onNotesVisibilityChange={vi.fn()}
                onRetryNotes={vi.fn()}
                onStatusChange={vi.fn()}
                selectedJobStatuses={JOB_STATUSES}
                upcomingInterviewCountByJob={{}}
            />
        );

        expect(dndState.collisionDetection?.({})).toEqual([pointerCollision]);

        dndState.pointerCollisions = [];
        expect(dndState.collisionDetection?.({})).toEqual([rectangleCollision]);
    });
});
