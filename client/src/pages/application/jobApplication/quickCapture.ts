export const QUICK_CAPTURE_JOB_URL_PARAM = 'jobURL';
export const QUICK_CAPTURE_PAGE_TITLE_PARAM = 'pageTitle';
export const MAX_CAPTURED_PAGE_TITLE_LENGTH = 300;

export type QuickCaptureData = {
    hasCaptureParameters: boolean;
    jobURL: string;
    pageTitle: string;
};

const createParameters = (value: string): URLSearchParams => {
    return new URLSearchParams(value.replace(/^[?#]/, ''));
};

const hasCaptureParameters = (parameters: URLSearchParams): boolean => {
    return parameters.has(QUICK_CAPTURE_JOB_URL_PARAM) || parameters.has(QUICK_CAPTURE_PAGE_TITLE_PARAM);
};

const serializeJavaScriptString = (value: string): string => {
    return JSON.stringify(value)
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
};

export const createQuickCaptureBookmarklet = (destinationURL: string): string => {
    const destination = serializeJavaScriptString(destinationURL);
    const jobURLParam = serializeJavaScriptString(QUICK_CAPTURE_JOB_URL_PARAM);
    const pageTitleParam = serializeJavaScriptString(QUICK_CAPTURE_PAGE_TITLE_PARAM);
    const script = [
        '(() => {',
        `const destination = new URL(${destination});`,
        'const payload = new URLSearchParams();',
        `payload.set(${jobURLParam}, window.location.href);`,
        `const pageTitle = document.title.trim().slice(0, ${MAX_CAPTURED_PAGE_TITLE_LENGTH});`,
        `if (pageTitle) { payload.set(${pageTitleParam}, pageTitle); }`,
        'destination.hash = payload.toString();',
        "window.open(destination.toString(), '_blank', 'noopener,noreferrer');",
        '})();',
    ].join('');

    return `javascript:${script}`;
};

export const getQuickCaptureData = (search: string, hash: string): QuickCaptureData => {
    const fragmentParameters = createParameters(hash);
    const queryParameters = createParameters(search);
    const parameters = hasCaptureParameters(fragmentParameters) ? fragmentParameters : queryParameters;
    const containsCaptureParameters = hasCaptureParameters(parameters);

    return {
        hasCaptureParameters: containsCaptureParameters,
        jobURL: parameters.get(QUICK_CAPTURE_JOB_URL_PARAM) ?? '',
        pageTitle: (parameters.get(QUICK_CAPTURE_PAGE_TITLE_PARAM) ?? '')
            .trim()
            .slice(0, MAX_CAPTURED_PAGE_TITLE_LENGTH),
    };
};

export const getQuickCaptureCleanPath = (pathname: string, search: string, hash: string): string => {
    const queryParameters = createParameters(search);
    queryParameters.delete(QUICK_CAPTURE_JOB_URL_PARAM);
    queryParameters.delete(QUICK_CAPTURE_PAGE_TITLE_PARAM);

    const fragmentParameters = createParameters(hash);
    const cleanSearch = queryParameters.toString();
    let cleanHash = hash;
    if (hasCaptureParameters(fragmentParameters)) {
        fragmentParameters.delete(QUICK_CAPTURE_JOB_URL_PARAM);
        fragmentParameters.delete(QUICK_CAPTURE_PAGE_TITLE_PARAM);
        const fragment = fragmentParameters.toString();
        cleanHash = fragment ? `#${fragment}` : '';
    }

    return `${pathname}${cleanSearch ? `?${cleanSearch}` : ''}${cleanHash}`;
};
