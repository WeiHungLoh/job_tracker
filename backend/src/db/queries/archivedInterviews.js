import { pool } from '../connectDB.js'

const getArchivedJobInterviews = async (userId) => {
    const res = await pool.query(
        `SELECT * FROM archived_interviews, archived_job_applications 
            WHERE archived_interviews.user_id = $1 
            AND archived_interviews.archived_job_id = archived_job_applications.archived_job_id 
            ORDER BY archived_interviews.interview_date ASC`, 
        [userId])
    return res.rows
}

const deleteAllCorrArchivedJobInterviews = async (userId) => {
    await pool.query(
        `DELETE FROM archived_interviews WHERE user_id = $1`,
        [userId]
    )
}

const deleteCorrArchivedJobInterview = async (jobId, userId) => {
    await pool.query(
        `DELETE FROM archived_interviews WHERE archived_job_id = $1 and user_id = $2`,
        [jobId, userId]
    )
}

const deleteArchivedJobInterview = async (interviewId, userId) => {
    await pool.query(
        `DELETE FROM archived_interviews WHERE archived_interview_id = $1 AND user_id = $2`,
        [interviewId, userId]
    )
}

export { deleteAllCorrArchivedJobInterviews, deleteCorrArchivedJobInterview, getArchivedJobInterviews,
    deleteArchivedJobInterview
 }
