import type { MouseEvent } from 'react';
import { useEffect, useRef } from 'react';
import { routes } from '../../../routes';
import { createQuickCaptureBookmarklet } from './quickCapture';
import styles from './QuickCaptureBookmarklet.module.css';

type QuickCaptureBookmarkletProps = {
    showInstructions?: boolean;
};

const QuickCaptureBookmarklet = ({ showInstructions = true }: QuickCaptureBookmarkletProps) => {
    const bookmarkRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        const destinationURL = new URL(routes.addApplication, window.location.origin).toString();

        // React 19 sanitizes javascript: href values, so this bookmark-only URL must be assigned directly.
        bookmarkRef.current?.setAttribute('href', createQuickCaptureBookmarklet(destinationURL));
    }, []);

    const preventBookmarkletExecution = (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
    };

    return (
        <div className={styles.quickCaptureBookmarklet}>
            {showInstructions && <p>Drag this link to your desktop browser’s bookmarks bar:</p>}
            <a ref={bookmarkRef} className={styles.bookmarkletLink} onClick={preventBookmarkletExecution}>
                Save to Job Tracker
            </a>
        </div>
    );
};

export default QuickCaptureBookmarklet;
