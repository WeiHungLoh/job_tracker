import { act, fireEvent, render, screen } from '@testing-library/react';
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

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(screen.queryByText('Saved successfully.')).not.toBeInTheDocument();
    });

    test('keeps error toasts past three seconds and dismisses them after eight seconds', () => {
        renderToastHarness();

        fireEvent.click(screen.getByRole('button', { name: /show error/i }));
        expect(screen.getByText('Unable to save.')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(screen.getByText('Unable to save.')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(screen.queryByText('Unable to save.')).not.toBeInTheDocument();
    });
});
