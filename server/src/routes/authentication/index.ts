import type { AuthenticationResponse, CredentialsRequest, EmptyResponse, SignUpResponse } from './models.js';
import type { CookieOptions, Request, Response } from 'express';
import { findUser, findUserInfo, insertUser } from '../../db/queries/users.js';
import { handleRouteError, sendError } from '../../http/responses.js';
import { isNonEmptyString, isValidEmail } from '../../http/validation.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';

dotenv.config();
const router = express.Router();

const authCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
};

const clearAuthCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
};

router.post(
    '/users',
    async (
        req: Request<Record<string, never>, SignUpResponse, CredentialsRequest>,
        res: Response<SignUpResponse>
    ): Promise<void> => {
        const { email, password } = req.body;

        if (!isValidEmail(email) || !isNonEmptyString(password)) {
            sendError(res, 422, 'A valid email and password are required.');
            return;
        }

        try {
            if (await findUser(email)) {
                sendError(res, 409, 'An account with this email already exists.');
                return;
            }

            await insertUser(email, await bcrypt.hash(password, 10), 'DEFAULT');
            res.status(201).send('User successfully registered');
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to register the user.');
        }
    }
);

router.post(
    '/sessions',
    async (
        req: Request<Record<string, never>, AuthenticationResponse, CredentialsRequest>,
        res: Response<AuthenticationResponse>
    ): Promise<void> => {
        const { email, password } = req.body;

        if (!isValidEmail(email) || !isNonEmptyString(password)) {
            sendError(res, 422, 'A valid email and password are required.');
            return;
        }

        const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
        if (!accessTokenSecret) {
            console.error('ACCESS_TOKEN_SECRET is not configured.');
            sendError(res, 503, 'Authentication is temporarily unavailable.');
            return;
        }

        try {
            const userInfo = await findUserInfo(email);
            if (!userInfo) {
                sendError(res, 404, 'User does not exist. Please create an account.');
                return;
            }

            if (!(await bcrypt.compare(password, userInfo.hashed_password))) {
                sendError(res, 401, 'Incorrect password.');
                return;
            }

            const accessToken = jwt.sign({ id: userInfo.user_id, email: userInfo.email }, accessTokenSecret, {
                expiresIn: '24h',
            });

            res.cookie('token', accessToken, authCookieOptions);
            res.status(200).send({ message: 'Successfully signed in.' });
        } catch (error: unknown) {
            handleRouteError(res, error, 'Unable to sign in.');
        }
    }
);

router.get(
    '/sessions/current',
    (req: Request<Record<string, never>, AuthenticationResponse>, res: Response<AuthenticationResponse>): void => {
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
            jwt.verify(token, accessTokenSecret);
            res.status(200).send({ message: 'Authenticated user.' });
        } catch (error: unknown) {
            console.warn('Token verification failed.', error);
            res.clearCookie('token', clearAuthCookieOptions);
            sendError(res, 401, 'Invalid or expired token. Please sign in.');
        }
    }
);

router.delete(
    '/sessions/current',
    (_req: Request<Record<string, never>, EmptyResponse>, res: Response<EmptyResponse>): void => {
        res.clearCookie('token', clearAuthCookieOptions);
        res.sendStatus(204);
    }
);

export default router;
