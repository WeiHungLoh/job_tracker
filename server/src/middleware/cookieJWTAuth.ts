import type { CookieOptions, NextFunction, Request, Response } from 'express';
import type { ErrorResponse } from '../http/models.js';
import jwt from 'jsonwebtoken';
import { sendError } from '../http/responses.js';

export const clearAuthCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
};

const cookieJWTAuth = (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
    const token = req.cookies.token as unknown;
    if (typeof token !== 'string' || !token) {
        sendError(res, 401, 'No authentication token found. Please sign in.');
        return;
    }

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!accessTokenSecret) {
        console.error('ACCESS_TOKEN_SECRET is not configured.');
        sendError(res, 503, 'Authentication is temporarily unavailable.');
        return;
    }

    try {
        const user = jwt.verify(token, accessTokenSecret);
        if (typeof user === 'string' || typeof user.id !== 'number' || typeof user.email !== 'string') {
            throw new jwt.JsonWebTokenError('Token payload is invalid');
        }

        req.user = { id: user.id, email: user.email };
        next();
    } catch (error: unknown) {
        console.warn('Invalid token. ', error);
        res.clearCookie('token', clearAuthCookieOptions);
        sendError(res, 401, 'Invalid or expired token. Please sign in.');
    }
};

export default cookieJWTAuth;
