import { Pool } from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const pool = new Pool({
    connectionString: process.env.PG_URI
})

const connectDB = async () => {
    try {
        const client = await pool.connect()
        console.log('Connected to pool')
        client.release()
    } catch (error) {
        console.log('Unable to connect to pool ' + error.message)
    }
}

export { pool, connectDB }
