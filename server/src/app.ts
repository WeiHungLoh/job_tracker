import { ALLOWED_ORIGINS, REQUEST_LIMIT, REQUEST_WINDOW_MS } from './config/server.js';
import applicationRoute from './routes/application/index.js';
import archivedApplicationRoute from './routes/archivedApplication/index.js';
import archivedInterviewRoute from './routes/archivedInterview/index.js';
import authRoute from './routes/authentication/index.js';
import authenticateAccessToken from './middleware/authenticateAccessToken.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler, type MiddlewareError, notFoundHandler } from './middleware/errorHandlers.js';
import interviewRoute from './routes/interview/index.js';
import offerDecisionRoute from './routes/offerDecision/index.js';
import rateLimit from 'express-rate-limit';
import userPreferencesRoute from './routes/userPreferences/index.js';

export const createApp = (): express.Express => {
    const app = express();
    app.set('trust proxy', 1);
    app.disable('x-powered-by');
    app.use(helmet());

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

    app.use('/authentication', authRoute);
    app.use('/job-applications', authenticateAccessToken, applicationRoute);
    app.use('/job-interviews', authenticateAccessToken, interviewRoute);
    app.use('/archived-job-applications', authenticateAccessToken, archivedApplicationRoute);
    app.use('/archived-job-interviews', authenticateAccessToken, archivedInterviewRoute);
    app.use('/offer-decisions', authenticateAccessToken, offerDecisionRoute);
    app.use('/user-preferences', authenticateAccessToken, userPreferencesRoute);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};
