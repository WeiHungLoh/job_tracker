import type { ArchivedJobInterview } from '../models.js'
import { pool } from '../connectDB.js'

const getArchivedJobInterviews = async (userId: number): Promise<ArchivedJobInterview[]> => {
    const res = await pool.query<ArchivedJobInterview>(
        `SELECT * FROM archived_interviews, archived_job_applications 
            WHERE archived_interviews.user_id = $1 
            AND archived_interviews.archived_job_id = archived_job_applications.archived_job_id 
            ORDER BY archived_interviews.interview_date ASC`,
        [userId])
    return res.rows
}

const deleteAllArchivedJobInterviews = async (userId: number): Promise<void> => {
    await pool.query(
        `DELETE FROM archived_interviews WHERE user_id = $1`,
        [userId]
    )
}

const deleteArchivedJobInterview = async (interviewId: string | number, userId: number): Promise<boolean> => {
    const result = await pool.query(
        `DELETE FROM archived_interviews WHERE archived_interview_id = $1 AND user_id = $2`,
        [interviewId, userId]
    )
    return (result.rowCount ?? 0) > 0
}

export { deleteAllArchivedJobInterviews, getArchivedJobInterviews, deleteArchivedJobInterview }
