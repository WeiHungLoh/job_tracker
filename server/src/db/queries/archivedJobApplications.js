import { pool } from '../connectDB.js'

const insertArchivedJobApplication = async (jobId, userId) => {
    const jobDetails = await pool.query(
        `SELECT * FROM job_applications WHERE job_id = $1 and user_id = $2`,
        [jobId, userId]
    )
    const jobApp = jobDetails.rows[0]

    const archivedRes = await pool.query(
        `INSERT INTO archived_job_applications (user_id, company_name, job_title, application_date,
            job_status, job_location, job_posting_url, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING archived_job_id`,
        [userId, jobApp.company_name, jobApp.job_title, jobApp.application_date,
            jobApp.job_status, jobApp.job_location, jobApp.job_posting_url, jobApp.notes]
    )

    const archivedJobId = archivedRes.rows[0].archived_job_id

    const interviewDetails = await pool.query(
        `SELECT * FROM interviews WHERE job_id = $1 AND user_id = $2`,
        [jobId, userId]
    )

    const jobInt = interviewDetails.rows

    jobInt.forEach(async (interview) => {
        await pool.query(
            `INSERT INTO archived_interviews (archived_job_id, user_id, interview_date, 
            interview_location, interview_type, interview_notes) VALUES ($1, $2, $3, $4, $5, $6)`,
            [archivedJobId, userId, interview.interview_date, interview.interview_location,
                interview.interview_type, interview.interview_notes]
        )
    })

    await pool.query(
        `DELETE FROM job_applications WHERE job_id = $1 AND user_id = $2`,
        [jobId, userId]
    )
}

const removeArchivedJobApplication = async (archivedJobId, userId) => {
    const jobDetails = await pool.query(
        `SELECT * FROM archived_job_applications WHERE archived_job_id = $1 and user_id = $2`,
        [archivedJobId, userId]
    )
    const jobApp = jobDetails.rows[0]

    const unarchivedRes = await pool.query(
        `INSERT INTO job_applications (user_id, company_name, job_title, application_date,
            job_status, job_location, job_posting_url, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING job_id`,
        [userId, jobApp.company_name, jobApp.job_title, jobApp.application_date,
            jobApp.job_status, jobApp.job_location, jobApp.job_posting_url, jobApp.notes]
    )

    const jobId = unarchivedRes.rows[0].job_id

    const interviewDetails = await pool.query(
        `SELECT * FROM archived_interviews WHERE archived_job_id = $1 AND user_id = $2`,
        [archivedJobId, userId]
    )

    const jobInt = interviewDetails.rows

    jobInt.forEach(async (interview) => {
        await pool.query(
            `INSERT INTO interviews (job_id, user_id, interview_date, 
            interview_location, interview_type, interview_notes) VALUES ($1, $2, $3, $4, $5, $6)`,
            [jobId, userId, interview.interview_date, interview.interview_location,
                interview.interview_type, interview.interview_notes]
        )
    })

    await pool.query(
        `DELETE FROM archived_job_applications WHERE archived_job_id = $1 AND user_id = $2`,
        [archivedJobId, userId]
    )
}

const getArchivedJobApplications = async (userId) => {
    const res = await pool.query(
        `SELECT * FROM archived_job_applications WHERE user_id = $1 
         ORDER BY 
            CASE 
                WHEN job_status = 'Accepted' THEN 1
                WHEN job_status = 'Offer' THEN 2
                WHEN job_status = 'Declined' THEN 3
                WHEN job_status = 'Interview' THEN 4
                WHEN job_status = 'Applied' THEN 5
                WHEN job_status = 'Ghosted' THEN 6
                ELSE 7
            END,
         application_date DESC`,
         [userId]
    )

    return res.rows
}

const deleteArchivedJobApplication = async (jobId, userId) => {
    await pool.query(
        `DELETE FROM archived_job_applications WHERE archived_job_id = $1 and user_id = $2`,
        [jobId, userId]
    )
}

const deleteAllArchivedJobApplications = async (userId) => {
    await pool.query(
        `DELETE FROM archived_job_applications WHERE user_id = $1`,
        [userId]
    )
}

export {
    insertArchivedJobApplication, getArchivedJobApplications, deleteArchivedJobApplication,
    deleteAllArchivedJobApplications, removeArchivedJobApplication
}
