import type { CookieOptions } from 'express';
import dotenv from 'dotenv';

dotenv.config();

export const AUTH_COOKIE_NAME = 'token';

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 6 * 60 * 60 * 1000,
};

export const CLEAR_AUTH_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: AUTH_COOKIE_OPTIONS.httpOnly,
    secure: AUTH_COOKIE_OPTIONS.secure,
    sameSite: AUTH_COOKIE_OPTIONS.sameSite,
    path: AUTH_COOKIE_OPTIONS.path,
};

export const getAccessTokenSecret = (): string | undefined => {
    return process.env.ACCESS_TOKEN_SECRET;
};
