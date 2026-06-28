import type { NextFunction, Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE_NAME, getAccessTokenSecret } from '../config/auth.js';
import type { ErrorResponse } from '../http/models.js';
import { clearAccessTokenCookie } from '../auth/cookies.js';
import { sendError } from '../http/responses.js';
import { verifyAccessToken } from '../auth/tokens.js';

const authenticateAccessToken = (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
    const token = req.cookies[ACCESS_TOKEN_COOKIE_NAME] as unknown;
    if (typeof token !== 'string' || !token) {
        clearAccessTokenCookie(res);
        sendError(res, 401, 'No authentication token found. Please sign in.');
        return;
    }

    const accessTokenSecret = getAccessTokenSecret();
    if (!accessTokenSecret) {
        console.error('ACCESS_TOKEN_SECRET is not configured.');
        sendError(res, 503, 'Authentication is temporarily unavailable.');
        return;
    }

    try {
        req.user = verifyAccessToken(token, accessTokenSecret);
        next();
    } catch (error: unknown) {
        console.warn('Access token verification failed.', error);
        clearAccessTokenCookie(res);
        sendError(res, 401, 'Invalid or expired token. Please sign in.');
    }
};

export default authenticateAccessToken;
