export const FIELD_MAX_LENGTHS = {
    companyName: 150,
    jobTitle: 150,
    location: 200,
    interviewType: 100,
    jobURL: 2048,
    notes: 3000,
} as const;

export const INTERVIEW_DURATION_MINUTES_MIN = 1;
export const INTERVIEW_DURATION_MINUTES_MAX = 1440;
export const DEFAULT_INTERVIEW_DURATION_MINUTES = 60;

export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_MAX_BYTES = 72;
