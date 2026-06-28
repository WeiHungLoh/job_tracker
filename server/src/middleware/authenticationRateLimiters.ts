import type { Request } from 'express';
import { AUTH_EMAIL_IP_LIMIT, AUTH_IP_LIMIT, AUTH_RATE_LIMIT_WINDOW_MS } from '../config/server.js';
import rateLimit from 'express-rate-limit';

const RATE_LIMIT_MESSAGE = { message: 'Too many authentication attempts. Please try again later.' };

const getEmailIpKey = (req: Request): string => {
    const email =
        typeof req.body?.email === 'string' && req.body.email.trim()
            ? req.body.email.trim().toLowerCase()
            : 'invalid-email';

    return `${req.ip}:${email}`;
};

export const authenticationIpRateLimiter = rateLimit({
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    limit: AUTH_IP_LIMIT,
    statusCode: 429,
    message: RATE_LIMIT_MESSAGE,
    standardHeaders: true,
    legacyHeaders: false,
});

export const authenticationEmailIpRateLimiter = rateLimit({
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    limit: AUTH_EMAIL_IP_LIMIT,
    keyGenerator: getEmailIpKey,
    statusCode: 429,
    message: RATE_LIMIT_MESSAGE,
    standardHeaders: true,
    legacyHeaders: false,
});
