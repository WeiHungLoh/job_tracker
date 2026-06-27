import type { ErrorRequestHandler, RequestHandler } from 'express';
import { REQUEST_LIMIT, REQUEST_WINDOW_MS } from './config/server.js';
import applicationRoute from './routes/application/index.js';
import archivedApplicationRoute from './routes/archivedApplication/index.js';
import archivedInterviewRoute from './routes/archivedInterview/index.js';
import authRoute from './routes/authentication/index.js';
import { connectDB } from './db/connectDB.js';
import cookieJWTAuth from './middleware/cookieJWTAuth.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import createTables from './db/queries/createTables.js';
import express from 'express';
import interviewRoute from './routes/interview/index.js';
import { pathToFileURL } from 'node:url';
import pingRoute from './routes/ping/index.js';
import rateLimit from 'express-rate-limit';
import { sendError } from './http/responses.js';
import userPreferencesRoute from './routes/userPreferences/index.js';

type MiddlewareError = Error & {
    status?: number;
    type?: string;
};

const ALLOWED_ORIGINS = new Set([
    'https://jobtracker-whloh.netlify.app',
    'https://jobtracker.weihungloh.com',
    'https://weihungloh.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.1.74:3000',
]);

const notFoundHandler: RequestHandler = (_req, res) => {
    sendError(res, 404, 'Route not found.');
};

const errorHandler: ErrorRequestHandler = (error: MiddlewareError, _req, res, _next) => {
    if (error.status === 403) {
        sendError(res, 403, 'Origin is not allowed.');
        return;
    }

    if (error.type === 'entity.too.large' || error.type === 'entity.parse.failed') {
        sendError(
            res,
            error.type === 'entity.too.large' ? 413 : 400,
            error.type === 'entity.too.large' ? 'Request body is too large.' : 'Request body contains invalid JSON.'
        );
        return;
    }

    console.error('Unhandled request error.', error);
    sendError(res, 500, 'An unexpected server error occurred.');
};

export const createApp = (): express.Express => {
    const app = express();
    app.set('trust proxy', 1);

    app.use(
        rateLimit({
            windowMs: REQUEST_WINDOW_MS,
            limit: REQUEST_LIMIT,
            statusCode: 429,
            message: { message: 'Too many requests. Please try again later.' },
            standardHeaders: true,
            legacyHeaders: false,
        })
    );

    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin || ALLOWED_ORIGINS.has(origin)) {
                    callback(null, true);
                    return;
                }

                const error = new Error('Origin is not allowed.') as MiddlewareError;
                error.status = 403;
                callback(error);
            },
            credentials: true,
        })
    );
    app.use(express.json());
    app.use(cookieParser());

    app.use('/ping', pingRoute);
    app.use('/authentication', authRoute);
    app.use('/job-applications', cookieJWTAuth, applicationRoute);
    app.use('/job-interviews', cookieJWTAuth, interviewRoute);
    app.use('/archived-job-applications', cookieJWTAuth, archivedApplicationRoute);
    app.use('/archived-job-interviews', cookieJWTAuth, archivedInterviewRoute);
    app.use('/user-preferences', cookieJWTAuth, userPreferencesRoute);
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};

const startServer = async (): Promise<void> => {
    await connectDB();
    await createTables();

    const app = createApp();
    const port = Number(process.env.PORT ?? 5005);
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server is running on port ${port}`);
    });
};

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
    void startServer().catch((error: unknown) => {
        console.error('Unable to start the server.', error);
        process.exitCode = 1;
    });
}
