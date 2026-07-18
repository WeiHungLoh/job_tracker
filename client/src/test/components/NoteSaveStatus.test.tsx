import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteSaveStatus from '../../components/noteSaveStatus/NoteSaveStatus';

describe('NoteSaveStatus', () => {
    test('renders no visible message while idle', () => {
        render(<NoteSaveStatus applicationName='ABC' onRetry={vi.fn()} status='idle' />);

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    test.each([
        ['saving', 'Saving…'],
        ['saved', 'Saved'],
    ] as const)('renders the %s message in a polite live region', (status, message) => {
        render(<NoteSaveStatus applicationName='ABC' onRetry={vi.fn()} status={status} />);

        expect(screen.getByRole('status')).toHaveTextContent(message);
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    test('renders a persistent error with an accessible Retry action', () => {
        const onRetry = vi.fn();
        render(<NoteSaveStatus applicationName='ABC' onRetry={onRetry} status='error' />);

        expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t save — Retry');
        userEvent.click(screen.getByRole('button', { name: 'Retry saving notes for ABC' }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});
