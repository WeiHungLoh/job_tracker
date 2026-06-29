import { fireEvent, render } from '@testing-library/react';
import OfflineBanner from '../../components/offlineBanner/OfflineBanner';

describe('OfflineBanner', () => {
    test('shows while offline and hides after reconnecting', () => {
        const { getByText, queryByText } = render(<OfflineBanner />);

        fireEvent(window, new Event('online'));
        expect(queryByText(/you’re offline/i)).not.toBeInTheDocument();

        fireEvent(window, new Event('offline'));
        expect(getByText(/you’re offline/i)).toBeInTheDocument();

        fireEvent(window, new Event('online'));
        expect(queryByText(/you’re offline/i)).not.toBeInTheDocument();
    });
});
