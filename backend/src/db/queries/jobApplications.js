import { pool } from '../connectDB.js'

const insertJobApplication = async (
    userId, companyName, jobTitle, applicationDate, jobStatus, jobLocation, jobURL
) => {
    await pool.query(
        `INSERT INTO job_applications (user_id, company_name, job_title, application_date, job_status, job_location, job_posting_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, companyName, jobTitle, applicationDate, jobStatus, jobLocation, jobURL]
    )
}

const getJobApplications = async (userId) => {
    const res = await pool.query(
        `SELECT * FROM job_applications WHERE user_id = $1 
         ORDER BY 
            CASE 
                WHEN job_status = 'Accepted' THEN 1
                WHEN job_status = 'Offer' THEN 2
                WHEN job_status = 'Interview' THEN 3
                WHEN job_status = 'Applied' THEN 4
                WHEN job_status = 'Ghosted' THEN 5
                ELSE 6
            END,
         application_date DESC`,
        [userId]
    )

    return res.rows
}

const getJobStatusCountPair = async (userId) => {
    const res = await pool.query(
        `SELECT job_status, COUNT(*) FROM job_applications WHERE user_id = $1 
        GROUP BY job_status ORDER BY job_status ASC`,
        [userId]
    )
    return res.rows
}

const getApplicationsForLatestEightWeeks = async (userId) => {
    const res = await pool.query(
        `WITH last_8_mondays AS (
            SELECT generate_series(
                date_trunc('week', CURRENT_DATE) - interval '7 weeks',
                date_trunc('week', CURRENT_DATE),
                interval '1 week'
            )::date AS start_of_week
        ),
        application_counts AS (
            SELECT
                DATE_TRUNC('week', application_date)::date AS start_of_week,
                COUNT(*) AS applications_count
            FROM job_applications
            WHERE user_id = $1
            GROUP BY start_of_week
        )
        SELECT
            m.start_of_week,
            CASE 
                WHEN a.applications_count IS NULL THEN 0
                ELSE a.applications_count
            END
        FROM last_8_mondays m LEFT JOIN application_counts a 
        ON m.start_of_week = a.start_of_week
        ORDER BY m.start_of_week ASC`,
        [userId]
    )
    return res.rows
}

const deleteJobApplication = async (jobId, userId) => {
    await pool.query(
        `DELETE FROM job_applications WHERE job_id = $1 AND user_id = $2`,
        [jobId, userId]
    )
}

const deleteAllJobApplications = async (userId) => {
    await pool.query(
        `DELETE FROM job_applications WHERE user_id = $1`,
        [userId]
    )
}

const toggleEditStatus = async (jobId, userId) => {
    await pool.query(
        `UPDATE job_applications SET edit_status = NOT edit_status WHERE job_id = $1 AND user_id = $2`,
        [jobId, userId]
    )
}

const toggleJobStatus = async (jobStatus, jobId, userId) => {
    await pool.query(
        `UPDATE job_applications SET job_status = $1 WHERE job_id = $2 AND user_id = $3`,
        [jobStatus, jobId, userId]
    )
}

export {
    insertJobApplication, getJobApplications, deleteJobApplication,
    deleteAllJobApplications, toggleEditStatus, toggleJobStatus, getJobStatusCountPair,
    getApplicationsForLatestEightWeeks
}
