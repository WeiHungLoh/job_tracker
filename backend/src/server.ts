import express from 'express'
import cors from 'cors'
import { connectDB } from './db/connectDB.js'
import authRoute from './routes/auth.js'
import verifyToken from './middleware/verifyToken.js'

const startServer = async (): Promise<void> => {
    await connectDB()
    const app = express()
    app.use(cors())
    app.use(express.json())

    app.use('/auth', authRoute)
    const PORT = process.env.PORT || 5005
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

startServer()
