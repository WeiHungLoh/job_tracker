import { FIELD_MAX_LENGTHS } from '../../../helper/formValidation';
import {
    MAX_CAPTURED_PAGE_TITLE_LENGTH,
    QUICK_CAPTURE_COMPANY_NAME_PARAM,
    QUICK_CAPTURE_JOB_LOCATION_PARAM,
    QUICK_CAPTURE_JOB_TITLE_PARAM,
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
        expect(bookmarklet).toContain('application/ld+json');
        expect(bookmarklet).toContain(JSON.stringify(QUICK_CAPTURE_COMPANY_NAME_PARAM));
        expect(bookmarklet).toContain(JSON.stringify(QUICK_CAPTURE_JOB_TITLE_PARAM));
        expect(bookmarklet).toContain(JSON.stringify(QUICK_CAPTURE_JOB_LOCATION_PARAM));
        expect(bookmarklet).toContain('extractJobPostingMetadata');
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

    test('executes the serialized extractor and opens a smart-capture payload', () => {
        const metadataScript = document.createElement('script');
        metadataScript.type = 'application/ld+json';
        metadataScript.textContent = JSON.stringify({
            '@type': 'JobPosting',
            title: 'Software Engineer',
            hiringOrganization: { name: 'Example' },
            jobLocationType: 'TELECOMMUTE',
        });
        document.head.append(metadataScript);
        const previousTitle = document.title;
        document.title = 'Software Engineer | Example Careers';
        const openWindow = vi.spyOn(window, 'open').mockReturnValue(null);
        const bookmarklet = createQuickCaptureBookmarklet('https://tracker.example/application/add');
        const script = bookmarklet.slice('javascript:'.length);

        try {
            // The generated source is trusted application code under test.
            new Function(script)();

            expect(openWindow).toHaveBeenCalledWith(
                expect.stringContaining('https://tracker.example/application/add#'),
                '_blank',
                'noopener,noreferrer'
            );
            const openedURL = new URL(openWindow.mock.calls[0][0] as string);
            const payload = new URLSearchParams(openedURL.hash.slice(1));
            expect(payload.get('jobURL')).toBe(window.location.href);
            expect(payload.get('pageTitle')).toBe('Software Engineer | Example Careers');
            expect(payload.get('companyName')).toBe('Example');
            expect(payload.get('jobTitle')).toBe('Software Engineer');
            expect(payload.get('jobLocation')).toBe('Remote');
        } finally {
            document.title = previousTitle;
            metadataScript.remove();
            openWindow.mockRestore();
        }
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
            companyName: '',
            jobTitle: '',
            jobLocation: '',
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
            companyName: '',
            jobTitle: '',
            jobLocation: '',
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
            companyName: '',
            jobTitle: '',
            jobLocation: '',
        });
    });

    test('reads bounded structured metadata fields from the fragment', () => {
        const fragment = new URLSearchParams({
            jobURL: 'https://example.com/jobs/1',
            pageTitle: 'Software Engineer | Careers',
            companyName: '  Example   Pte Ltd ',
            jobTitle: ' Software Engineer ',
            jobLocation: ' Singapore ',
        });

        expect(getQuickCaptureData('', `#${fragment.toString()}`)).toEqual({
            hasCaptureParameters: true,
            jobURL: 'https://example.com/jobs/1',
            pageTitle: 'Software Engineer | Careers',
            companyName: 'Example Pte Ltd',
            jobTitle: 'Software Engineer',
            jobLocation: 'Singapore',
        });
    });

    test('ignores over-limit structured metadata fields from an untrusted capture URL', () => {
        const fragment = new URLSearchParams({
            jobURL: 'https://example.com/jobs/1',
            companyName: 'x'.repeat(FIELD_MAX_LENGTHS.companyName + 1),
            jobTitle: 'x'.repeat(FIELD_MAX_LENGTHS.jobTitle + 1),
            jobLocation: 'x'.repeat(FIELD_MAX_LENGTHS.location + 1),
        });

        expect(getQuickCaptureData('', `#${fragment.toString()}`)).toEqual({
            hasCaptureParameters: true,
            jobURL: 'https://example.com/jobs/1',
            pageTitle: '',
            companyName: '',
            jobTitle: '',
            jobLocation: '',
        });
    });

    test('keeps the version 1 URL and title payload valid', () => {
        const fragment = new URLSearchParams({
            jobURL: 'https://example.com/jobs/legacy',
            pageTitle: 'Legacy capture',
        });

        expect(getQuickCaptureData('', `#${fragment.toString()}`)).toEqual({
            hasCaptureParameters: true,
            jobURL: 'https://example.com/jobs/legacy',
            pageTitle: 'Legacy capture',
            companyName: '',
            jobTitle: '',
            jobLocation: '',
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

    test('removes all smart-capture values while preserving unrelated fragment values', () => {
        const fragment = new URLSearchParams({
            jobURL: 'https://example.com/jobs/1',
            pageTitle: 'Engineer',
            companyName: 'Example',
            jobTitle: 'Engineer',
            jobLocation: 'Remote',
            section: 'details',
        });

        expect(getQuickCaptureCleanPath('/application/add', '?source=guide', `#${fragment.toString()}`)).toBe(
            '/application/add?source=guide#section=details'
        );
    });

    test('removes smart-capture values from a legacy query payload', () => {
        const query = new URLSearchParams({
            companyName: 'Example',
            jobTitle: 'Engineer',
            jobLocation: 'Remote',
            source: 'saved',
        });

        expect(getQuickCaptureCleanPath('/application/add', `?${query.toString()}`, '')).toBe(
            '/application/add?source=saved'
        );
    });
});
