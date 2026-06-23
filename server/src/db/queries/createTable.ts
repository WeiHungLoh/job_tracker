import { pool } from '../connectDB.js';

const createTable = async (): Promise<void> => {
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`;

    const createJobAppTable = `CREATE TABLE IF NOT EXISTS job_applications (
            job_id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
            company_name TEXT NOT NULL,
            job_title TEXT NOT NULL,
            application_date TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            job_status TEXT CHECK (job_status IN ('Accepted', 'Applied', 'Declined', 'Ghosted', 'Interview', 'Offer', 'Rejected')),
            edit_status BOOLEAN DEFAULT false,
            job_location TEXT,
            job_posting_url TEXT,
            notes TEXT,
            is_archived BOOLEAN NOT NULL DEFAULT false
        )`;

    const createInterviewTable = `CREATE TABLE IF NOT EXISTS interviews (
            interview_id SERIAL PRIMARY KEY,
            job_id INTEGER REFERENCES job_applications(job_id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(user_id),
            interview_date TIMESTAMPTZ NOT NULL,
            interview_location TEXT NOT NULL,
            interview_type TEXT,
            interview_notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_archived BOOLEAN NOT NULL DEFAULT false
        )`;

    const createUserPreferencesTable = `CREATE TABLE IF NOT EXISTS user_preferences (
            user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
            application_job_status TEXT NOT NULL DEFAULT 'Show All' CHECK (
                application_job_status IN ('Show All', 'Accepted', 'Applied', 'Declined', 'Ghosted', 'Interview', 'Offer', 'Rejected')
            ),
            application_show_notes BOOLEAN NOT NULL DEFAULT false,
            application_show_archive BOOLEAN NOT NULL DEFAULT false,
            archived_application_job_status TEXT NOT NULL DEFAULT 'Show All' CHECK (
                archived_application_job_status IN ('Show All', 'Accepted', 'Applied', 'Declined', 'Ghosted', 'Interview', 'Offer', 'Rejected')
            ),
            archived_application_show_notes BOOLEAN NOT NULL DEFAULT false
        )`;

    const createJobApplicationArchiveIndex = `CREATE INDEX IF NOT EXISTS job_applications_user_archived_idx
        ON job_applications (user_id, is_archived)`;

    const createInterviewArchiveIndex = `CREATE INDEX IF NOT EXISTS interviews_user_archived_idx
        ON interviews (user_id, is_archived)`;

    const createInterviewJobIdIndex = `CREATE INDEX IF NOT EXISTS interviews_job_id_idx
        ON interviews (job_id)`;

    const populateUserPreferences = `
        INSERT INTO user_preferences (user_id)
        SELECT users.user_id
        FROM users
        WHERE NOT EXISTS (
            SELECT 1
            FROM user_preferences
            WHERE user_preferences.user_id = users.user_id
        )`;

    try {
        await pool.query(createUsersTable);
        await pool.query(createJobAppTable);
        await pool.query(createInterviewTable);
        await pool.query(createUserPreferencesTable);
        await pool.query(populateUserPreferences);
        await pool.query(createJobApplicationArchiveIndex);
        await pool.query(createInterviewArchiveIndex);
        await pool.query(createInterviewJobIdIndex);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.log('Unable to create table ' + message);
    }
};

export default createTable;
