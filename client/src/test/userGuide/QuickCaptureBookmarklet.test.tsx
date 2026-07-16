import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import QuickCaptureBookmarklet from '../../pages/userGuide/components/quickCaptureBookmarklet/QuickCaptureBookmarklet';
import { routes } from '../../routes';

globalThis.fetch = vi.fn();

describe('QuickCaptureBookmarklet', () => {
    beforeEach(() => {
        fetch.mockReset();
    });

    test('renders a draggable bookmark anchor for the current Job Tracker origin', () => {
        render(<QuickCaptureBookmarklet />);

        const bookmark = screen.getByRole('link', { name: 'Save to Job Tracker' });
        const destinationURL = new URL(routes.addApplication, window.location.origin).toString();

        expect(bookmark.tagName).toBe('A');
        expect(bookmark).toHaveAttribute('href', expect.stringMatching(/^javascript:/));
        expect(bookmark.getAttribute('href')).toContain(JSON.stringify(destinationURL));
        expect(screen.getByText(/drag this link to your desktop browser(?:'|’)s bookmarks bar/i)).toBeVisible();
        expect(fetch).not.toHaveBeenCalled();
    });

    test('prevents an ordinary click without disabling dragging', () => {
        render(<QuickCaptureBookmarklet />);

        const bookmark = screen.getByRole('link', { name: 'Save to Job Tracker' });
        const clickEvent = createEvent.click(bookmark);
        fireEvent(bookmark, clickEvent);

        expect(clickEvent.defaultPrevented).toBe(true);
        expect(bookmark).not.toHaveAttribute('draggable', 'false');
    });
});
