import express from 'express'
import cors from 'cors'
import { connectDB } from './db/connectDB.js'
import createTable from './db/queries/createTable.js'
import authRoute from './routes/auth.js'
import applicationRoute from './routes/application.js'
import interviewRoute from './routes/interview.js'
import archivedApplicationRoute from './routes/archivedapplication.js'
import archivedInterviewRoute from './routes/archivedinterview.js'
import pingRoute from './routes/ping.js'
import verifyToken from './middleware/verifyToken.js'

const startServer = async () => {
    await connectDB()
    await createTable()
    const app = express()
    app.use(cors())
    app.use(express.json())

    app.use('/ping', pingRoute)
    app.use('/auth', authRoute)
    app.use('/application', verifyToken, applicationRoute)
    app.use('/interview', verifyToken, interviewRoute)
    app.use('/archivedapplication', verifyToken, archivedApplicationRoute)
    app.use('/archivedinterview', verifyToken, archivedInterviewRoute)

    const PORT = process.env.PORT || 5005;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer()
