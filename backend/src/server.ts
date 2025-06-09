import express from 'express'
import cors from 'cors'
import { connectDB } from './db/connectDB.ts'

const startServer = async (): Promise<void> => {
    await connectDB()
    const app = express()
    app.use(cors())
    app.use(express.json())

    
}

startServer()
