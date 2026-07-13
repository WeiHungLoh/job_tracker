import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import DemoApplicationBoard from '../../pages/demo/application/jobApplication/applicationBoard/DemoApplicationBoard';
import { JOB_STATUSES } from '../../pages/application/models';

const dndState = vi.hoisted(() => ({
    canScroll: undefined as ((element: Element) => boolean) | undefined,
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
    }: {
        autoScroll: { canScroll: (element: Element) => boolean };
        children: ReactNode;
    }) => {
        dndState.canScroll = autoScroll.canScroll;
        return children;
    },
    KeyboardSensor: class KeyboardSensor {},
    PointerSensor: class PointerSensor {},
    useSensor: vi.fn(() => ({})),
    useSensors: vi.fn(() => []),
}));

vi.mock('../../pages/demo/application/applicationBoard/DemoApplicationBoardColumn', () => ({
    default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('DemoApplicationBoard', () => {
    test('allows horizontal auto-scroll while dragging a card', () => {
        render(
            <DemoApplicationBoard
                applications={[]}
                deletingApplicationIds={new Set()}
                editedNotes={{}}
                hasInterview={() => false}
                isArchivingApplication={() => false}
                onArchive={vi.fn()}
                onDelete={vi.fn()}
                onEditNotes={vi.fn()}
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
    });
});
