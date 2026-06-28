export const FIELD_MAX_LENGTHS = {
    companyName: 150,
    jobTitle: 150,
    location: 200,
    interviewType: 100,
    jobURL: 2048,
    notes: 3000,
} as const;

const HOSTNAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/i;

export const isValidHttpURL = (value: string): boolean => {
    try {
        const parsedURL = new URL(value);
        return (
            (parsedURL.protocol === 'http:' || parsedURL.protocol === 'https:') &&
            HOSTNAME_PATTERN.test(parsedURL.hostname)
        );
    } catch {
        return false;
    }
};
