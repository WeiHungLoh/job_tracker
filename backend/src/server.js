import applicationRoute from './routes/application.js'
import archivedApplicationRoute from './routes/archivedapplication.js'
import archivedInterviewRoute from './routes/archivedinterview.js'
import authRoute from './routes/auth.js'
import { connectDB } from './db/connectDB.js'
import cookieJWTAuth from './middleware/cookieJWTAuth.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import createTable from './db/queries/createTable.js'
import express from 'express'
import interviewRoute from './routes/interview.js'
import pingRoute from './routes/ping.js'

const startServer = async () => {
    await connectDB()
    await createTable()
    const app = express()

    const allowedOrigins = [
        'https://jobtracker-whloh.netlify.app/',
        'https://jobtracker.weihungloh.com/',
        'https://weihungloh.com/',
        'http://localhost:3000'
    ]

    app.use(cors({
        // Taken from: https://article.arunangshudas.com/7-tips-for-managing-cors-in-your-backend-applications-a4341385110c
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    }))
    app.use(express.json())
    app.use(cookieParser())

    app.use('/ping', pingRoute)
    app.use('/auth', authRoute)
    app.use('/application', cookieJWTAuth, applicationRoute)
    app.use('/interview', cookieJWTAuth, interviewRoute)
    app.use('/archivedapplication', cookieJWTAuth, archivedApplicationRoute)
    app.use('/archivedinterview', cookieJWTAuth, archivedInterviewRoute)

    const PORT = process.env.PORT || 5005
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

startServer()
