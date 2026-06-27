import type { JobApplication, JobStatus, JobStatusCount, WeeklyApplicationCount } from '../models.js';
import { pool } from '../connectDB.js';
import { hasAffectedRows, JOB_STATUS_SORT_ORDER } from './shared.js';

export const insertJobApplication = async (
    userId: number,
    companyName: string,
    jobTitle: string,
    applicationDate: string,
    jobStatus: JobStatus,
    jobLocation: string,
    jobURL: string
): Promise<void> => {
    await pool.query(
        `INSERT INTO job_applications (user_id, company_name, job_title, application_date, job_status, job_location, job_posting_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, companyName, jobTitle, applicationDate, jobStatus, jobLocation, jobURL]
    );
};

export const getJobApplications = async (
    userId: number,
    jobStatus: JobStatus | null = null
): Promise<JobApplication[]> => {
    const result = await pool.query<JobApplication>(
        `SELECT * FROM job_applications WHERE user_id = $1 AND is_archived = false
          AND ($2::text IS NULL OR job_status = $2)
          ORDER BY ${JOB_STATUS_SORT_ORDER},
         application_date DESC`,
        [userId, jobStatus]
    );

    return result.rows;
};

export const getJobStatusCounts = async (userId: number): Promise<JobStatusCount[]> => {
    const result = await pool.query<JobStatusCount>(
        `SELECT job_status, COUNT(*) FROM job_applications WHERE user_id = $1 AND is_archived = false
        GROUP BY job_status ORDER BY job_status ASC`,
        [userId]
    );
    return result.rows;
};

export const getApplicationsForLatestEightWeeks = async (userId: number): Promise<WeeklyApplicationCount[]> => {
    const result = await pool.query<WeeklyApplicationCount>(
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
            WHERE user_id = $1 AND is_archived = false
            GROUP BY start_of_week
        )
        SELECT
            weeks.start_of_week,
            COALESCE(counts.applications_count, 0) AS applications_count
        FROM last_8_mondays AS weeks
        LEFT JOIN application_counts AS counts
            ON weeks.start_of_week = counts.start_of_week
        ORDER BY weeks.start_of_week ASC`,
        [userId]
    );
    return result.rows;
};

export const deleteJobApplication = async (jobId: number, userId: number): Promise<boolean> => {
    const result = await pool.query(
        `DELETE FROM job_applications WHERE job_id = $1 AND user_id = $2 AND is_archived = false`,
        [jobId, userId]
    );
    return hasAffectedRows(result);
};

export const deleteAllJobApplications = async (userId: number): Promise<void> => {
    await pool.query(`DELETE FROM job_applications WHERE user_id = $1 AND is_archived = false`, [userId]);
};

export const editNotes = async (jobId: number, userId: number, notes: string): Promise<boolean> => {
    const result = await pool.query(
        `UPDATE job_applications SET notes = $1
         WHERE job_id = $2 AND user_id = $3 AND is_archived = false`,
        [notes, jobId, userId]
    );
    return hasAffectedRows(result);
};

export const updateEditStatus = async (editStatus: boolean, jobId: number, userId: number): Promise<boolean> => {
    const result = await pool.query(
        `UPDATE job_applications SET edit_status = $1
         WHERE job_id = $2 AND user_id = $3 AND is_archived = false`,
        [editStatus, jobId, userId]
    );
    return hasAffectedRows(result);
};

export const updateJobStatus = async (jobStatus: JobStatus, jobId: number, userId: number): Promise<boolean> => {
    const result = await pool.query(
        `UPDATE job_applications SET job_status = $1
         WHERE job_id = $2 AND user_id = $3 AND is_archived = false`,
        [jobStatus, jobId, userId]
    );
    return hasAffectedRows(result);
};
