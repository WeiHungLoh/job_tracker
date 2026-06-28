import type { AuthenticatedUser } from './models.js';
import { ACCESS_TOKEN_DURATION_SECONDS, REFRESH_TOKEN_DURATION_SECONDS } from '../config/auth.js';
import jwt from 'jsonwebtoken';

const AUTHENTICATION_TOKEN_ALGORITHM = 'HS256';

type AuthenticationTokenType = 'access' | 'refresh';

const createAuthenticationToken = (
    user: AuthenticatedUser,
    secret: string,
    tokenType: AuthenticationTokenType,
    expiresIn: number
): string => {
    return jwt.sign({ ...user, tokenType }, secret, {
        algorithm: AUTHENTICATION_TOKEN_ALGORITHM,
        expiresIn,
    });
};

const verifyAuthenticationToken = (
    token: string,
    secret: string,
    expectedTokenType: AuthenticationTokenType
): AuthenticatedUser => {
    const payload = jwt.verify(token, secret, {
        algorithms: [AUTHENTICATION_TOKEN_ALGORITHM],
    });

    if (
        typeof payload === 'string' ||
        payload.tokenType !== expectedTokenType ||
        typeof payload.id !== 'number' ||
        typeof payload.email !== 'string'
    ) {
        throw new jwt.JsonWebTokenError('Token payload is invalid');
    }

    return { id: payload.id, email: payload.email };
};

export const createAccessToken = (user: AuthenticatedUser, secret: string): string => {
    return createAuthenticationToken(user, secret, 'access', ACCESS_TOKEN_DURATION_SECONDS);
};

export const createRefreshToken = (user: AuthenticatedUser, secret: string): string => {
    return createAuthenticationToken(user, secret, 'refresh', REFRESH_TOKEN_DURATION_SECONDS);
};

export const verifyAccessToken = (token: string, secret: string): AuthenticatedUser => {
    return verifyAuthenticationToken(token, secret, 'access');
};

export const verifyRefreshToken = (token: string, secret: string): AuthenticatedUser => {
    return verifyAuthenticationToken(token, secret, 'refresh');
};
