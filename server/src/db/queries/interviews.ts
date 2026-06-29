import type { JobInterview } from '../models.js';
import { pool } from '../connectDB.js';
import { hasAffectedRows } from './shared.js';

export type InsertInterviewResult = 'created' | 'invalid-date' | 'not-found';

export const insertInterview = async (
    jobId: number,
    userId: number,
    interviewDate: string,
    location: string,
    interviewType: string,
    notes: string
): Promise<InsertInterviewResult> => {
    const result = await pool.query<{ application_exists: boolean; interview_created: boolean }>(
        `WITH application AS (
            SELECT application_date
            FROM job_applications
            WHERE job_id = $1 AND user_id = $2 AND is_archived = false
        ),
        inserted_interview AS (
            INSERT INTO interviews (
                job_id,
                user_id,
                interview_date,
                interview_location,
                interview_type,
                interview_notes
            )
            SELECT $1, $2, $3, $4, $5, $6
            FROM application
            WHERE application_date IS NOT NULL AND $3::timestamptz > application_date
            RETURNING 1
        )
        SELECT
            EXISTS(SELECT 1 FROM application) AS application_exists,
            EXISTS(SELECT 1 FROM inserted_interview) AS interview_created`,
        [jobId, userId, interviewDate, location, interviewType, notes]
    );

    if (result.rows[0]?.interview_created) {
        return 'created';
    }
    return result.rows[0]?.application_exists ? 'invalid-date' : 'not-found';
};

export const getInterviews = async (userId: number): Promise<JobInterview[]> => {
    const result = await pool.query<JobInterview>(
        `SELECT
            interviews.interview_id,
            interviews.job_id,
            interviews.interview_date,
            interviews.interview_location,
            interviews.interview_type,
            interviews.interview_notes,
            job_applications.company_name,
            job_applications.job_title,
            job_applications.job_status
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
    return result.rows;
};

export const deleteJobInterview = async (interviewId: number, userId: number): Promise<boolean> => {
    const result = await pool.query(
        `DELETE FROM interviews WHERE interview_id = $1 AND user_id = $2 AND is_archived = false`,
        [interviewId, userId]
    );
    return hasAffectedRows(result);
};

export const deleteAllJobInterviews = async (userId: number): Promise<void> => {
    await pool.query(`DELETE FROM interviews WHERE user_id = $1 AND is_archived = false`, [userId]);
};
