import { isInvalidDatetimeLocalInput, parseDatetimeLocal } from './dateFormatter';
import { INTERVIEW_DURATION_MINUTES_MAX, INTERVIEW_DURATION_MINUTES_MIN } from './interviewTiming';

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

type ValidForm<TValues> = {
    isValid: true;
    values: TValues;
};

type InvalidForm = {
    error: string;
    isValid: false;
};

type FormValidationResult<TValues> = ValidForm<TValues> | InvalidForm;

type ApplicationFormInput = {
    applicationDate: string;
    applicationDateValidity?: ValidityState;
    companyName: string;
    jobLocation: string;
    jobTitle: string;
    jobURL: string;
};

type ValidApplicationFormValues = {
    applicationDate: Date;
    companyName: string;
    jobLocation: string;
    jobTitle: string;
    jobURL: string;
};

type InterviewFormInput = {
    applicationDate: string;
    interviewDate: string;
    interviewDateValidity?: ValidityState;
    interviewDurationMinutes: string;
    interviewDurationValidity?: ValidityState;
    interviewLocation: string;
    interviewType: string;
    notes: string;
};

type ValidInterviewFormValues = {
    interviewDate: Date;
    interviewDurationMinutes: number;
    interviewLocation: string;
    interviewType: string;
    notes: string;
};

const invalidForm = (error: string): InvalidForm => ({ error, isValid: false });

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

export const validateApplicationForm = (
    { applicationDate, applicationDateValidity, companyName, jobLocation, jobTitle, jobURL }: ApplicationFormInput,
    currentDate = new Date()
): FormValidationResult<ValidApplicationFormValues> => {
    const trimmedCompanyName = companyName.trim();
    const trimmedJobTitle = jobTitle.trim();
    const trimmedJobLocation = jobLocation.trim();
    const trimmedJobURL = jobURL.trim();

    if (!trimmedCompanyName || !trimmedJobTitle) {
        return invalidForm('Please enter company name and job title before adding a job application.');
    }

    if (trimmedCompanyName.length > FIELD_MAX_LENGTHS.companyName) {
        return invalidForm(`Company name must be ${FIELD_MAX_LENGTHS.companyName} characters or fewer.`);
    }

    if (trimmedJobTitle.length > FIELD_MAX_LENGTHS.jobTitle) {
        return invalidForm(`Job title must be ${FIELD_MAX_LENGTHS.jobTitle} characters or fewer.`);
    }

    if (trimmedJobLocation.length > FIELD_MAX_LENGTHS.location) {
        return invalidForm(`Job location must be ${FIELD_MAX_LENGTHS.location} characters or fewer.`);
    }

    if (trimmedJobURL.length > FIELD_MAX_LENGTHS.jobURL) {
        return invalidForm(`Job URL must be ${FIELD_MAX_LENGTHS.jobURL} characters or fewer.`);
    }

    if (isInvalidDatetimeLocalInput(applicationDate, applicationDateValidity)) {
        return invalidForm('Please enter a valid application date.');
    }

    const parsedApplicationDate = applicationDate ? parseDatetimeLocal(applicationDate) : currentDate;

    if (parsedApplicationDate > currentDate) {
        return invalidForm('Application date cannot be later than the current date.');
    }

    if (trimmedJobURL && !isValidHttpURL(trimmedJobURL)) {
        return invalidForm('URL must be in a valid format.');
    }

    return {
        isValid: true,
        values: {
            applicationDate: parsedApplicationDate,
            companyName: trimmedCompanyName,
            jobLocation: trimmedJobLocation,
            jobTitle: trimmedJobTitle,
            jobURL: trimmedJobURL,
        },
    };
};

export const validateInterviewForm = ({
    applicationDate,
    interviewDate,
    interviewDateValidity,
    interviewDurationMinutes,
    interviewDurationValidity,
    interviewLocation,
    interviewType,
    notes,
}: InterviewFormInput): FormValidationResult<ValidInterviewFormValues> => {
    const trimmedInterviewLocation = interviewLocation.trim();
    const trimmedInterviewType = interviewType.trim();
    const trimmedNotes = notes.trim();
    const parsedDuration = Number(interviewDurationMinutes);

    if (isInvalidDatetimeLocalInput(interviewDate, interviewDateValidity)) {
        return invalidForm('Please enter a valid interview date.');
    }

    if (!interviewDate || !trimmedInterviewLocation) {
        return invalidForm('Please enter a date and location before adding an interview.');
    }

    if (
        !interviewDurationMinutes.trim() ||
        interviewDurationValidity?.badInput ||
        interviewDurationValidity?.rangeUnderflow ||
        interviewDurationValidity?.rangeOverflow ||
        interviewDurationValidity?.stepMismatch ||
        !Number.isInteger(parsedDuration) ||
        parsedDuration < INTERVIEW_DURATION_MINUTES_MIN ||
        parsedDuration > INTERVIEW_DURATION_MINUTES_MAX
    ) {
        return invalidForm(
            `Please enter a duration between ${INTERVIEW_DURATION_MINUTES_MIN} and ${INTERVIEW_DURATION_MINUTES_MAX} minutes`
        );
    }

    if (trimmedInterviewLocation.length > FIELD_MAX_LENGTHS.location) {
        return invalidForm(`Interview location must be ${FIELD_MAX_LENGTHS.location} characters or fewer.`);
    }

    if (trimmedInterviewType.length > FIELD_MAX_LENGTHS.interviewType) {
        return invalidForm(`Interview type must be ${FIELD_MAX_LENGTHS.interviewType} characters or fewer.`);
    }

    if (trimmedNotes.length > FIELD_MAX_LENGTHS.notes) {
        return invalidForm(`Notes must be ${FIELD_MAX_LENGTHS.notes} characters or fewer.`);
    }

    const parsedInterviewDate = parseDatetimeLocal(interviewDate);
    if (parsedInterviewDate <= new Date(applicationDate)) {
        return invalidForm('Interview date must be after the job application date.');
    }

    return {
        isValid: true,
        values: {
            interviewDate: parsedInterviewDate,
            interviewDurationMinutes: parsedDuration,
            interviewLocation: trimmedInterviewLocation,
            interviewType: trimmedInterviewType,
            notes: trimmedNotes,
        },
    };
};
