import { pool } from '../connectDB.js'

const insertInterview = async (
    jobId, userId, interview_date, location, interview_type, notes
) => {
    await pool.query(
        `INSERT INTO interviews (job_id, user_id, interview_date, interview_location, interview_type, notes)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [jobId, userId, interview_date, location, interview_type, notes]
    )
}

const getInterviews = async (userId) => {
    const res = await pool.query(
        `SELECT * FROM interviews, job_applications WHERE interviews.user_id = $1 
            AND interviews.job_id = job_applications.job_id ORDER BY interviews.interview_date ASC`, 
        [userId])
    return res.rows
}

const deleteJobInterview = async (interviewId, userId) => {
    await pool.query(
        `DELETE FROM interviews WHERE interview_id = $1 and user_id = $2`,
        [interviewId, userId]
    )
}

const deleteCorrJobInterview = async (jobId, userId) => {
    await pool.query(
        `DELETE FROM interviews WHERE job_id = $1 AND user_id = $2`,
        [jobId, userId]
    )
}

const deleteAllCorrJobInterviews = async (userId) => {
    await pool.query(
        `DELETE FROM interviews WHERE userId = $1`,
        [userId]
    )
}

const deleteAllJobInterviews = async (userId) => {
    await pool.query(
        `DELETE FROM interviews WHERE user_id = $1`,
        [userId]
    )
}

export { insertInterview, getInterviews, deleteJobInterview, deleteAllJobInterviews,
    deleteCorrJobInterview, deleteAllCorrJobInterviews }