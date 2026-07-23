export type JobPostingMetadataLimits = {
    companyName: number;
    jobTitle: number;
    location: number;
};

export type CapturedJobPostingMetadata = {
    companyName: string;
    jobTitle: string;
    jobLocation: string;
};

export const extractJobPostingMetadata = (
    jsonLdBlocks: readonly string[],
    pageURL: string,
    limits: JobPostingMetadataLimits
): CapturedJobPostingMetadata => {
    type JsonObject = Record<string, unknown>;

    const emptyMetadata: CapturedJobPostingMetadata = {
        companyName: '',
        jobTitle: '',
        jobLocation: '',
    };

    const isObject = (value: unknown): value is JsonObject => {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    };

    const normalizeText = (value: unknown): string => {
        return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
    };

    const boundedText = (value: unknown, maximumLength: number): string => {
        const normalized = normalizeText(value);
        return normalized.length <= maximumLength ? normalized : '';
    };

    const isJobPosting = (value: JsonObject): boolean => {
        const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
        return types.some((type) => normalizeText(type).toLowerCase() === 'jobposting');
    };

    const candidates: JsonObject[] = [];
    const collectCandidates = (value: unknown): void => {
        if (Array.isArray(value)) {
            value.forEach(collectCandidates);
            return;
        }
        if (!isObject(value)) {
            return;
        }
        if (isJobPosting(value)) {
            candidates.push(value);
        }
        if (Array.isArray(value['@graph'])) {
            value['@graph'].forEach(collectCandidates);
        }
    };

    jsonLdBlocks.forEach((block) => {
        try {
            collectCandidates(JSON.parse(block));
        } catch {
            // Ignore malformed JSON-LD and continue checking the remaining blocks.
        }
    });

    const comparableURL = (value: unknown): string | undefined => {
        if (typeof value !== 'string') {
            return undefined;
        }
        try {
            const parsedURL = new URL(value, pageURL);
            const pathname =
                parsedURL.pathname.length > 1 ? parsedURL.pathname.replace(/\/+$/, '') : parsedURL.pathname;
            return `${parsedURL.protocol}//${parsedURL.host}${pathname}`;
        } catch {
            return undefined;
        }
    };

    let selectedCandidate: JsonObject | undefined;
    if (candidates.length === 1) {
        selectedCandidate = candidates[0];
    } else if (candidates.length > 1) {
        const currentURL = comparableURL(pageURL);
        const matchingCandidates = candidates.filter(
            (candidate) => currentURL !== undefined && comparableURL(candidate.url) === currentURL
        );
        if (matchingCandidates.length === 1) {
            selectedCandidate = matchingCandidates[0];
        }
    }

    if (!selectedCandidate) {
        return emptyMetadata;
    }

    const hiringOrganization = isObject(selectedCandidate.hiringOrganization)
        ? selectedCandidate.hiringOrganization
        : undefined;
    const companyName = boundedText(hiringOrganization?.name, limits.companyName);
    const jobTitle = boundedText(selectedCandidate.title, limits.jobTitle);

    const locationTypes = Array.isArray(selectedCandidate.jobLocationType)
        ? selectedCandidate.jobLocationType
        : [selectedCandidate.jobLocationType];
    const isRemote = locationTypes.some((locationType) => normalizeText(locationType).toUpperCase() === 'TELECOMMUTE');

    let jobLocation = '';
    if (isRemote) {
        jobLocation = boundedText('Remote', limits.location);
    } else {
        const locations = Array.isArray(selectedCandidate.jobLocation)
            ? selectedCandidate.jobLocation
            : [selectedCandidate.jobLocation];
        if (locations.length === 1 && isObject(locations[0])) {
            const address = isObject(locations[0].address) ? locations[0].address : undefined;
            if (address) {
                const country = isObject(address.addressCountry) ? address.addressCountry.name : address.addressCountry;
                const uniqueParts: string[] = [];
                [address.addressLocality, address.addressRegion, country].forEach((part) => {
                    const normalizedPart = normalizeText(part);
                    if (
                        normalizedPart &&
                        !uniqueParts.some((existingPart) => existingPart.toLowerCase() === normalizedPart.toLowerCase())
                    ) {
                        uniqueParts.push(normalizedPart);
                    }
                });
                jobLocation = boundedText(uniqueParts.join(', '), limits.location);
            }
        }
    }

    return {
        companyName,
        jobTitle,
        jobLocation,
    };
};
