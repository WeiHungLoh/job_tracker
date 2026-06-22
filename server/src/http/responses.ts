import type { ErrorResponse, ErrorStatus } from './models.js';
import type { Response } from 'express';

export const sendError = <T>(res: Response<T | ErrorResponse>, status: ErrorStatus, message: string): void => {
    res.status(status).send({ message });
};

export const handleRouteError = <T>(
    res: Response<T | ErrorResponse>,
    error: unknown,
    fallbackMessage: string
): void => {
    console.error(fallbackMessage, error);
    sendError(res, 500, fallbackMessage);
};
