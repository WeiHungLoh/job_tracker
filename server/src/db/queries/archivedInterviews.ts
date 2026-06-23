import type { ArchivedJobInterview } from '../models.js';
import { pool } from '../connectDB.js';

const getArchivedJobInterviews = async (userId: number): Promise<ArchivedJobInterview[]> => {
    const res = await pool.query<ArchivedJobInterview>(
        `SELECT
            interviews.interview_id AS archived_interview_id,
            interviews.job_id AS archived_job_id,
            interviews.user_id,
            interviews.interview_date,
            interviews.interview_location,
            interviews.interview_type,
            interviews.interview_notes,
            interviews.created_at,
            job_applications.company_name,
            job_applications.job_title,
            job_applications.job_status
         FROM interviews
         INNER JOIN job_applications ON interviews.job_id = job_applications.job_id
         WHERE interviews.user_id = $1
            AND interviews.is_archived = true
            AND job_applications.is_archived = true
         ORDER BY
            interviews.interview_date > NOW() DESC,
            interviews.interview_date ASC`,
        [userId]
    );
    return res.rows;
};

const deleteAllArchivedJobInterviews = async (userId: number): Promise<void> => {
    await pool.query(`DELETE FROM interviews WHERE user_id = $1 AND is_archived = true`, [userId]);
};

const deleteArchivedJobInterview = async (interviewId: string | number, userId: number): Promise<boolean> => {
    const result = await pool.query(
        `DELETE FROM interviews WHERE interview_id = $1 AND user_id = $2 AND is_archived = true`,
        [interviewId, userId]
    );
    return (result.rowCount ?? 0) > 0;
};

export { deleteAllArchivedJobInterviews, getArchivedJobInterviews, deleteArchivedJobInterview };
