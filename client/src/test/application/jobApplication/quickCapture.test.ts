import {
    MAX_CAPTURED_PAGE_TITLE_LENGTH,
    QUICK_CAPTURE_JOB_URL_PARAM,
    QUICK_CAPTURE_PAGE_TITLE_PARAM,
    createQuickCaptureBookmarklet,
} from '../../../pages/application/jobApplication/quickCapture';

describe('createQuickCaptureBookmarklet', () => {
    test('captures the current page URL and optional trimmed page title in a new tab', () => {
        const destinationURL = 'https://tracker.example/application/add';
        const bookmarklet = createQuickCaptureBookmarklet(destinationURL);

        expect(bookmarklet).toMatch(/^javascript:/);
        expect(bookmarklet).toContain(JSON.stringify(destinationURL));
        expect(bookmarklet).toContain('window.location.href');
        expect(bookmarklet).toContain('document.title.trim()');
        expect(bookmarklet).toContain(`slice(0, ${MAX_CAPTURED_PAGE_TITLE_LENGTH})`);
        expect(bookmarklet).toContain(JSON.stringify(QUICK_CAPTURE_JOB_URL_PARAM));
        expect(bookmarklet).toContain(JSON.stringify(QUICK_CAPTURE_PAGE_TITLE_PARAM));
        expect(bookmarklet).toContain("window.open(destination.toString(), '_blank', 'noopener,noreferrer')");
        expect(bookmarklet).toMatch(/if \(pageTitle\)/);
    });

    test('safely serializes significant characters in the destination', () => {
        const destinationURL = 'https://tracker.example/application/"quoted"?return=</script>&line=\u2028';
        const bookmarklet = createQuickCaptureBookmarklet(destinationURL);

        expect(bookmarklet).toContain(JSON.stringify(destinationURL).replace('\u2028', '\\u2028'));
        expect(bookmarklet).not.toContain(`new URL('${destinationURL}')`);
    });
});
