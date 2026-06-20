import type { ErrorRequestHandler, RequestHandler } from 'express'
import applicationRoute from './routes/application/index.js'
import archivedApplicationRoute from './routes/archivedApplication/index.js'
import archivedInterviewRoute from './routes/archivedInterview/index.js'
import authRoute from './routes/authentication/index.js'
import { connectDB } from './db/connectDB.js'
import cookieJWTAuth from './middleware/cookieJWTAuth.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import createTable from './db/queries/createTable.js'
import express from 'express'
import interviewRoute from './routes/interview/index.js'
import { pathToFileURL } from 'node:url'
import pingRoute from './routes/ping/index.js'
import rateLimit from 'express-rate-limit'

type MiddlewareError = Error & {
    status?: number
    type?: string
}

const allowedOrigins = new Set([
    'https://jobtracker-whloh.netlify.app',
    'https://jobtracker.weihungloh.com',
    'https://weihungloh.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.1.74:3000'
])

const createApp = (): express.Express => {
    const app = express()

    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        statusCode: 429,
        message: { message: 'Too many requests. Please try again later.' },
        standardHeaders: true,
        legacyHeaders: false
    }))

    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.has(origin)) {
                callback(null, true)
                return
            }

            const error = new Error('Origin is not allowed.') as MiddlewareError
            error.status = 403
            callback(error)
        },
        credentials: true
    }))
    app.use(express.json())
    app.use(cookieParser())

    app.use('/ping', pingRoute)
    app.use('/authentication', authRoute)
    app.use('/job-applications', cookieJWTAuth, applicationRoute)
    app.use('/job-interviews', cookieJWTAuth, interviewRoute)
    app.use('/archived-job-applications', cookieJWTAuth, archivedApplicationRoute)
    app.use('/archived-job-interviews', cookieJWTAuth, archivedInterviewRoute)

    const notFoundHandler: RequestHandler = (_req, res) => {
        res.status(404).json({ message: 'Route not found.' })
    }
    app.use(notFoundHandler)

    const errorHandler: ErrorRequestHandler = (error: MiddlewareError, _req, res, _next) => {
        void _next
        if (error.status === 403) {
            res.status(403).json({ message: 'Origin is not allowed.' })
            return
        }
        if (error.type === 'entity.too.large') {
            res.status(413).json({ message: 'Request body is too large.' })
            return
        }
        if (error instanceof SyntaxError && error.status === 400) {
            res.status(400).json({ message: 'Request body contains invalid JSON.' })
            return
        }

        console.error('Unhandled request error.', error)
        res.status(500).json({ message: 'An unexpected server error occurred.' })
    }
    app.use(errorHandler)

    return app
}

const startServer = async (): Promise<void> => {
    await connectDB()
    await createTable()

    const app = createApp()
    const port = Number(process.env.PORT ?? 5005)
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server is running on port ${port}`)
    })
}

const entrypoint = process.argv[1]
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
    void startServer()
}

export { createApp }
