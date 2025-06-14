import { pool } from '../connectDB'

interface User {
    user_id: number
    email: string
    hashed_password: string
    created_at: Date
}

interface Application {
    job_id: number
    user_id: number
    company_name: string
    job_title: string
    application_date: Date
    job_status: 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Accepted'
    location?: string | null
    job_posting_url?: string | null
}

interface Interview {
    interview_id: number
    job_id: number
    interview_date: string
    location: string
    interview_type?: string | null
    notes?: string | null
    created_at: Date
}

const createTable = async () => {
    const createUsersTable: string =
        `
        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            sorting_preferences TEXT CHECK (sorting_preferences IN ('DEFAULT', 'APPLICATION_DATE')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`

    const createJobAppTable: string =
        `CREATE TABLE IF NOT EXISTS job_applications (
            job_id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
            company_name TEXT NOT NULL,
            job_title TEXT NOT NULL,
            application_date TIMESTAMP NOT NULL,
            job_status TEXT CHECK (job_status IN ('Applied', 'Interview', 'Offer', 'Rejected', 'Accepted')),
            location TEXT,
            job_posting_url TEXT
        )`

    const createInterviewTable: string =
        `CREATE TABLE IF NOT EXISTS interviews (
            interview_id SERIAL PRIMARY KEY,
            job_id INTEGER REFERENCES job_applications(job_id) ON DELETE CASCADE,
            interview_date TIMESTAMP NOT NULL,
            location TEXT NOT NULL,
            interview_type TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`

    try {
        await pool.query(createUsersTable)
        await pool.query(createJobAppTable)
        await pool.query(createInterviewTable)
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.log('Unable to create table ' + error.message)
        } else {
            console.log('Unable to create table', error)
        }
    }
}

export default createTable
