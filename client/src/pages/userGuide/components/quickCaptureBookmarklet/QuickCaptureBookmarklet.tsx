import type { MouseEvent } from 'react';
import { useEffect, useRef } from 'react';
import { createQuickCaptureBookmarklet } from '../../../application/jobApplication/quickCapture';
import { routes } from '../../../../routes';
import styles from './QuickCaptureBookmarklet.module.css';

const QuickCaptureBookmarklet = () => {
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
            <p>Drag this link to your desktop browser’s bookmarks bar:</p>
            <a ref={bookmarkRef} className={styles.bookmarkletLink} onClick={preventBookmarkletExecution}>
                Save to Job Tracker
            </a>
        </div>
    );
};

export default QuickCaptureBookmarklet;
