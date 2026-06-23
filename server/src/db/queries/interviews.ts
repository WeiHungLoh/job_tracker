import type { JobInterview } from '../models.js';
import { pool } from '../connectDB.js';

const insertInterview = async (
    jobId: string | number,
    userId: number,
    interview_date: string,
    location: string,
    interview_type: string,
    notes: string
): Promise<boolean> => {
    const result = await pool.query(
        `INSERT INTO interviews (job_id, user_id, interview_date, interview_location, interview_type, interview_notes)
        SELECT $1, $2, $3, $4, $5, $6
        WHERE EXISTS (
            SELECT 1 FROM job_applications
            WHERE job_id = $1 AND user_id = $2 AND is_archived = false
        )`,
        [jobId, userId, interview_date, location, interview_type, notes]
    );
    return (result.rowCount ?? 0) > 0;
};

const getInterviews = async (userId: number): Promise<JobInterview[]> => {
    const res = await pool.query<JobInterview>(
        `SELECT interviews.*, job_applications.company_name, job_applications.job_title, job_applications.job_status
         FROM interviews
         INNER JOIN job_applications ON interviews.job_id = job_applications.job_id
         WHERE interviews.user_id = $1
            AND interviews.is_archived = false
            AND job_applications.is_archived = false
         ORDER BY
             interviews.interview_date > NOW() DESC,
             interviews.interview_date ASC`,
        [userId]
    );
    return res.rows;
};

const deleteJobInterview = async (interviewId: string | number, userId: number): Promise<boolean> => {
    const result = await pool.query(
        `DELETE FROM interviews WHERE interview_id = $1 AND user_id = $2 AND is_archived = false`,
        [interviewId, userId]
    );
    return (result.rowCount ?? 0) > 0;
};

const deleteAllJobInterviews = async (userId: number): Promise<void> => {
    await pool.query(`DELETE FROM interviews WHERE user_id = $1 AND is_archived = false`, [userId]);
};

export { insertInterview, getInterviews, deleteJobInterview, deleteAllJobInterviews };
