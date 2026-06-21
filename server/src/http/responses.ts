import type { ErrorResponse, ErrorStatus } from './models.js';
import type { Response } from 'express';

type DatabaseError = Error & {
    code?: string;
};

type DatabaseErrorResponse = {
    message: string;
    status: ErrorStatus;
};

const databaseUnavailableResponse: DatabaseErrorResponse = {
    status: 503,
    message: 'The database service is temporarily unavailable.',
};

const databaseUnavailableCodes = new Set([
    '53300',
    '57P01',
    '57P02',
    '57P03',
    'ECONNREFUSED',
    'ECONNRESET',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ENOTFOUND',
    'ETIMEDOUT',
]);

const duplicateResourceResponse: DatabaseErrorResponse = {
    status: 409,
    message: 'A resource with the same value already exists.',
};

const getDatabaseErrorResponse = (code?: string): DatabaseErrorResponse | undefined => {
    if (!code) return undefined;
    if (code.startsWith('08') || databaseUnavailableCodes.has(code)) return databaseUnavailableResponse;
    if (code === '23505') return duplicateResourceResponse;
    return undefined;
};

export const sendError = <T>(res: Response<T | ErrorResponse>, status: ErrorStatus, message: string): void => {
    res.status(status).send({ message });
};

export const handleRouteError = <T>(
    res: Response<T | ErrorResponse>,
    error: unknown,
    fallbackMessage: string
): void => {
    const databaseError = error instanceof Error ? (error as DatabaseError) : undefined;
    const mappedError = getDatabaseErrorResponse(databaseError?.code);

    console.error(fallbackMessage, error);
    sendError(res, mappedError?.status ?? 500, mappedError?.message ?? fallbackMessage);
};
