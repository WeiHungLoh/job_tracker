export const QUICK_CAPTURE_JOB_URL_PARAM = 'jobURL';
export const QUICK_CAPTURE_PAGE_TITLE_PARAM = 'pageTitle';
export const MAX_CAPTURED_PAGE_TITLE_LENGTH = 300;

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
        `destination.searchParams.set(${jobURLParam}, window.location.href);`,
        `const pageTitle = document.title.trim().slice(0, ${MAX_CAPTURED_PAGE_TITLE_LENGTH});`,
        `if (pageTitle) { destination.searchParams.set(${pageTitleParam}, pageTitle); }`,
        "window.open(destination.toString(), '_blank', 'noopener,noreferrer');",
        '})();',
    ].join('');

    return `javascript:${script}`;
};
