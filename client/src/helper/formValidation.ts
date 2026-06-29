export const FIELD_MAX_LENGTHS = {
    companyName: 150,
    jobTitle: 150,
    location: 200,
    interviewType: 100,
    jobURL: 2048,
    notes: 3000,
} as const;

export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_MAX_BYTES = 72;

const HOSTNAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/i;

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const getPasswordValidationError = (value: string): string | undefined => {
    const passwordLength = [...value].length;
    if (passwordLength < PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (passwordLength > PASSWORD_MAX_LENGTH) {
        return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`;
    }
    if (new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES) {
        return 'Password is too long when encoded. Use fewer Unicode characters.';
    }
    return undefined;
};

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
