import { FIELD_MAX_LENGTHS } from '../../../helper/formValidation';
import { extractJobPostingMetadata, type JobPostingMetadataLimits } from './jobPostingMetadata';

export const QUICK_CAPTURE_JOB_URL_PARAM = 'jobURL';
export const QUICK_CAPTURE_PAGE_TITLE_PARAM = 'pageTitle';
export const QUICK_CAPTURE_COMPANY_NAME_PARAM = 'companyName';
export const QUICK_CAPTURE_JOB_TITLE_PARAM = 'jobTitle';
export const QUICK_CAPTURE_JOB_LOCATION_PARAM = 'jobLocation';
export const MAX_CAPTURED_PAGE_TITLE_LENGTH = 300;

const QUICK_CAPTURE_PARAMETERS = [
    QUICK_CAPTURE_JOB_URL_PARAM,
    QUICK_CAPTURE_PAGE_TITLE_PARAM,
    QUICK_CAPTURE_COMPANY_NAME_PARAM,
    QUICK_CAPTURE_JOB_TITLE_PARAM,
    QUICK_CAPTURE_JOB_LOCATION_PARAM,
] as const;

const JOB_POSTING_METADATA_LIMITS: JobPostingMetadataLimits = {
    companyName: FIELD_MAX_LENGTHS.companyName,
    jobTitle: FIELD_MAX_LENGTHS.jobTitle,
    location: FIELD_MAX_LENGTHS.location,
};

export type QuickCaptureData = {
    hasCaptureParameters: boolean;
    jobURL: string;
    pageTitle: string;
    companyName: string;
    jobTitle: string;
    jobLocation: string;
};

const createParameters = (value: string): URLSearchParams => {
    return new URLSearchParams(value.replace(/^[?#]/, ''));
};

const hasCaptureParameters = (parameters: URLSearchParams): boolean => {
    return QUICK_CAPTURE_PARAMETERS.some((parameter) => parameters.has(parameter));
};

const normalizeCapturedValue = (value: string | null, maximumLength: number): string => {
    const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
    return normalized.length <= maximumLength ? normalized : '';
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
    const companyNameParam = serializeJavaScriptString(QUICK_CAPTURE_COMPANY_NAME_PARAM);
    const jobTitleParam = serializeJavaScriptString(QUICK_CAPTURE_JOB_TITLE_PARAM);
    const jobLocationParam = serializeJavaScriptString(QUICK_CAPTURE_JOB_LOCATION_PARAM);
    const metadataExtractor = extractJobPostingMetadata.toString();
    const metadataLimits = JSON.stringify(JOB_POSTING_METADATA_LIMITS);
    const script = [
        '(() => {',
        `const destination = new URL(${destination});`,
        'const payload = new URLSearchParams();',
        `payload.set(${jobURLParam}, window.location.href);`,
        `const pageTitle = document.title.trim().slice(0, ${MAX_CAPTURED_PAGE_TITLE_LENGTH});`,
        `if (pageTitle) { payload.set(${pageTitleParam}, pageTitle); }`,
        "const metadataBlocks = Array.from(document.querySelectorAll('script[type=\"application/ld+json\"]'), (script) => script.textContent || '');",
        `const extractJobPostingMetadata = ${metadataExtractor};`,
        `const metadata = extractJobPostingMetadata(metadataBlocks, window.location.href, ${metadataLimits});`,
        `if (metadata.companyName) { payload.set(${companyNameParam}, metadata.companyName); }`,
        `if (metadata.jobTitle) { payload.set(${jobTitleParam}, metadata.jobTitle); }`,
        `if (metadata.jobLocation) { payload.set(${jobLocationParam}, metadata.jobLocation); }`,
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
        companyName: normalizeCapturedValue(
            parameters.get(QUICK_CAPTURE_COMPANY_NAME_PARAM),
            FIELD_MAX_LENGTHS.companyName
        ),
        jobTitle: normalizeCapturedValue(parameters.get(QUICK_CAPTURE_JOB_TITLE_PARAM), FIELD_MAX_LENGTHS.jobTitle),
        jobLocation: normalizeCapturedValue(
            parameters.get(QUICK_CAPTURE_JOB_LOCATION_PARAM),
            FIELD_MAX_LENGTHS.location
        ),
    };
};

export const getQuickCaptureCleanPath = (pathname: string, search: string, hash: string): string => {
    const queryParameters = createParameters(search);
    QUICK_CAPTURE_PARAMETERS.forEach((parameter) => queryParameters.delete(parameter));

    const fragmentParameters = createParameters(hash);
    const cleanSearch = queryParameters.toString();
    let cleanHash = hash;
    if (hasCaptureParameters(fragmentParameters)) {
        QUICK_CAPTURE_PARAMETERS.forEach((parameter) => fragmentParameters.delete(parameter));
        const fragment = fragmentParameters.toString();
        cleanHash = fragment ? `#${fragment}` : '';
    }

    return `${pathname}${cleanSearch ? `?${cleanSearch}` : ''}${cleanHash}`;
};
