import {
    MAX_CAPTURED_PAGE_TITLE_LENGTH,
    QUICK_CAPTURE_JOB_URL_PARAM,
    QUICK_CAPTURE_PAGE_TITLE_PARAM,
    createQuickCaptureBookmarklet,
    getQuickCaptureData,
    getQuickCaptureCleanPath,
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
        expect(bookmarklet).toContain('destination.hash = payload.toString()');
        expect(bookmarklet).not.toContain('destination.searchParams.set');
    });

    test('safely serializes significant characters in the destination', () => {
        const destinationURL = 'https://tracker.example/application/"quoted"?return=</script>&line=\u2028';
        const bookmarklet = createQuickCaptureBookmarklet(destinationURL);

        expect(bookmarklet).toContain(JSON.stringify(destinationURL).replace('\u2028', '\\u2028'));
        expect(bookmarklet).not.toContain(`new URL('${destinationURL}')`);
    });
});

describe('getQuickCaptureData', () => {
    test('reads capture data from the URL fragment', () => {
        const fragment = new URLSearchParams({
            jobURL: 'https://example.com/jobs/1',
            pageTitle: '  Software Engineer  ',
        });

        expect(getQuickCaptureData('', `#${fragment.toString()}`)).toEqual({
            hasCaptureParameters: true,
            jobURL: 'https://example.com/jobs/1',
            pageTitle: 'Software Engineer',
        });
    });

    test('prefers the complete fragment payload over legacy query parameters', () => {
        const query = new URLSearchParams({
            jobURL: 'https://legacy.example/jobs/1',
            pageTitle: 'Legacy title',
        });
        const fragment = new URLSearchParams({ jobURL: 'https://private.example/jobs/2' });

        expect(getQuickCaptureData(`?${query.toString()}`, `#${fragment.toString()}`)).toEqual({
            hasCaptureParameters: true,
            jobURL: 'https://private.example/jobs/2',
            pageTitle: '',
        });
    });

    test('supports legacy query parameters when no capture fragment is present', () => {
        const query = new URLSearchParams({
            jobURL: 'https://legacy.example/jobs/1',
            pageTitle: 'Legacy title',
        });

        expect(getQuickCaptureData(`?${query.toString()}`, '')).toEqual({
            hasCaptureParameters: true,
            jobURL: 'https://legacy.example/jobs/1',
            pageTitle: 'Legacy title',
        });
    });
});

describe('getQuickCaptureCleanPath', () => {
    test('removes capture data while preserving unrelated query parameters', () => {
        const query = new URLSearchParams({
            jobURL: 'https://example.com/jobs/1',
            source: 'guide',
        });
        const fragment = new URLSearchParams({
            jobURL: 'https://example.com/jobs/2',
            pageTitle: 'Software Engineer',
        });

        expect(getQuickCaptureCleanPath('/application/add', `?${query.toString()}`, `#${fragment.toString()}`)).toBe(
            '/application/add?source=guide'
        );
    });

    test('preserves a non-capture fragment', () => {
        expect(getQuickCaptureCleanPath('/application/add', '?pageTitle=Legacy', '#details')).toBe(
            '/application/add#details'
        );
    });

    test('removes capture keys while preserving unrelated fragment parameters', () => {
        expect(
            getQuickCaptureCleanPath(
                '/application/add',
                '',
                '#jobURL=https%3A%2F%2Fexample.com%2Fjobs%2F1&section=details'
            )
        ).toBe('/application/add#section=details');
    });
});
