import { pool } from '../connectDB.js'

const createTable = async () => {
    const createUsersTable =
        `
        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            sorting_preferences TEXT CHECK (sorting_preferences IN ('DEFAULT', 'APPLICATION_DATE')),
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`

    const createJobAppTable =
        `CREATE TABLE IF NOT EXISTS job_applications (
            job_id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
            company_name TEXT NOT NULL,
            job_title TEXT NOT NULL,
            application_date TIMESTAMPTZ,
            job_status TEXT CHECK (job_status IN ('Applied', 'Interview', 'Offer', 'Rejected', 'Accepted')),
            edit_status BOOLEAN DEFAULT false,
            job_location TEXT,
            job_posting_url TEXT
        )`

    const createInterviewTable =
        `CREATE TABLE IF NOT EXISTS interviews (
            interview_id SERIAL PRIMARY KEY,
            job_id INTEGER REFERENCES job_applications(job_id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(user_id),
            interview_date TIMESTAMPTZ NOT NULL,
            interview_location TEXT NOT NULL,
            interview_type TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`

    const createArchivedApplicationTable =
        `CREATE TABLE IF NOT EXISTS archived_job_applications (
            archived_job_id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
            company_name TEXT NOT NULL,
            job_title TEXT NOT NULL,
            application_date TIMESTAMPTZ,
            job_status TEXT CHECK (job_status IN ('Applied', 'Interview', 'Offer', 'Rejected', 'Accepted')),
            job_location TEXT,
            job_posting_url TEXT
        )`

    const createArchivedInterviewTable =
        `CREATE TABLE IF NOT EXISTS archived_interviews (
            archived_interview_id SERIAL PRIMARY KEY,
            archived_job_id INTEGER REFERENCES archived_job_applications(archived_job_id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(user_id) ,
            interview_date TIMESTAMPTZ NOT NULL,
            interview_location TEXT NOT NULL,
            interview_type TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    try {
        await pool.query(createUsersTable)
        await pool.query(createJobAppTable)
        await pool.query(createInterviewTable)
        await pool.query(createArchivedApplicationTable)
        await pool.query(createArchivedInterviewTable)
    } catch (error) {
        {
            console.log('Unable to create table ' + error.message)
        }
    }
}

export default createTable
