import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ToastProvider, useToast } from '../../components/toast/ToastProvider';

const ToastHarness = () => {
    const { showErrorToast, showSuccessToast } = useToast();

    return (
        <>
            <button type='button' onClick={() => showSuccessToast('Saved successfully.')}>
                Show success
            </button>
            <button type='button' onClick={() => showErrorToast('Unable to save.')}>
                Show error
            </button>
        </>
    );
};

const renderToastHarness = () => {
    render(
        <ToastProvider>
            <ToastHarness />
        </ToastProvider>
    );
};

describe('ToastProvider durations', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    test('dismisses success toasts after three seconds', () => {
        renderToastHarness();

        fireEvent.click(screen.getByRole('button', { name: /show success/i }));
        expect(screen.getByText('Saved successfully.')).toBeInTheDocument();
        expect(screen.getByTestId('toast').style.getPropertyValue('--toast-duration')).toBe('3000ms');

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(screen.queryByText('Saved successfully.')).not.toBeInTheDocument();
    });

    test('keeps error toasts past three seconds and dismisses them after eight seconds', () => {
        renderToastHarness();

        fireEvent.click(screen.getByRole('button', { name: /show error/i }));
        expect(screen.getByText('Unable to save.')).toBeInTheDocument();
        expect(screen.getByTestId('toast').style.getPropertyValue('--toast-duration')).toBe('8000ms');

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(screen.getByText('Unable to save.')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(screen.queryByText('Unable to save.')).not.toBeInTheDocument();
    });

    test('manually dismisses a toast and clears its automatic-dismiss timer', () => {
        const clearTimeout = vi.spyOn(window, 'clearTimeout');
        renderToastHarness();

        fireEvent.click(screen.getByRole('button', { name: /show success/i }));
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));

        expect(screen.queryByText('Saved successfully.')).not.toBeInTheDocument();
        expect(clearTimeout).toHaveBeenCalled();
    });

    test('keeps mixed toast durations and timers independent', () => {
        renderToastHarness();

        fireEvent.click(screen.getByRole('button', { name: /show success/i }));
        fireEvent.click(screen.getByRole('button', { name: /show error/i }));

        const [successToast, errorToast] = screen.getAllByTestId('toast');
        expect(successToast).toHaveAttribute('role', 'status');
        expect(successToast.style.getPropertyValue('--toast-duration')).toBe('3000ms');
        expect(errorToast).toHaveAttribute('role', 'alert');
        expect(errorToast.style.getPropertyValue('--toast-duration')).toBe('8000ms');
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

        fireEvent.click(within(successToast).getByRole('button', { name: 'Dismiss notification' }));
        expect(screen.queryByText('Saved successfully.')).not.toBeInTheDocument();
        expect(screen.getByText('Unable to save.').closest('[data-testid="toast"]')).toBe(errorToast);

        act(() => {
            vi.advanceTimersByTime(7999);
        });
        expect(screen.getByText('Unable to save.')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(screen.queryByText('Unable to save.')).not.toBeInTheDocument();
    });

    test('does not restart an existing timer when another success toast is added', () => {
        renderToastHarness();

        fireEvent.click(screen.getByRole('button', { name: /show success/i }));
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        fireEvent.click(screen.getByRole('button', { name: /show success/i }));
        expect(screen.getAllByText('Saved successfully.')).toHaveLength(2);

        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(screen.getAllByText('Saved successfully.')).toHaveLength(1);

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(screen.queryByText('Saved successfully.')).not.toBeInTheDocument();
    });
});
