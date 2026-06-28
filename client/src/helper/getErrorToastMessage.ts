import { JobTrackerAPIError } from '../api/models';

export const isJobTrackerAPIError = (error: unknown): error is JobTrackerAPIError => {
    return error instanceof JobTrackerAPIError;
};

export const getErrorToastMessage = (error: unknown, fallback: string): string => {
    return isJobTrackerAPIError(error) ? error.message : fallback;
};
