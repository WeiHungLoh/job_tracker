import type { JobApplication, JobStatus, JobStatusCount, WeeklyApplicationCount } from '../models.js';
import { pool } from '../connectDB.js';

const insertJobApplication = async (
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

const getJobApplications = async (userId: number): Promise<JobApplication[]> => {
    const res = await pool.query<JobApplication>(
        `SELECT * FROM job_applications WHERE user_id = $1 
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
    );

    return res.rows;
};

const getJobStatusCountPair = async (userId: number): Promise<JobStatusCount[]> => {
    const res = await pool.query<JobStatusCount>(
        `SELECT job_status, COUNT(*) FROM job_applications WHERE user_id = $1 
        GROUP BY job_status ORDER BY job_status ASC`,
        [userId]
    );
    return res.rows;
};

const getApplicationsForLatestEightWeeks = async (userId: number): Promise<WeeklyApplicationCount[]> => {
    const res = await pool.query<WeeklyApplicationCount>(
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
    );
    return res.rows;
};

const deleteJobApplication = async (jobId: string | number, userId: number): Promise<boolean> => {
    const result = await pool.query(`DELETE FROM job_applications WHERE job_id = $1 AND user_id = $2`, [jobId, userId]);
    return (result.rowCount ?? 0) > 0;
};

const deleteAllJobApplications = async (userId: number): Promise<void> => {
    await pool.query(`DELETE FROM job_applications WHERE user_id = $1`, [userId]);
};

const editNotes = async (jobId: string | number, userId: number, notes: string): Promise<boolean> => {
    const result = await pool.query(`UPDATE job_applications SET notes = $1 WHERE job_id = $2 AND user_id = $3`, [
        notes,
        jobId,
        userId,
    ]);
    return (result.rowCount ?? 0) > 0;
};

const updateEditStatus = async (editStatus: boolean, jobId: string | number, userId: number): Promise<boolean> => {
    const result = await pool.query(`UPDATE job_applications SET edit_status = $1 WHERE job_id = $2 AND user_id = $3`, [
        editStatus,
        jobId,
        userId,
    ]);
    return (result.rowCount ?? 0) > 0;
};

const updateJobStatus = async (jobStatus: JobStatus, jobId: string | number, userId: number): Promise<boolean> => {
    const result = await pool.query(`UPDATE job_applications SET job_status = $1 WHERE job_id = $2 AND user_id = $3`, [
        jobStatus,
        jobId,
        userId,
    ]);
    return (result.rowCount ?? 0) > 0;
};

export {
    insertJobApplication,
    getJobApplications,
    deleteJobApplication,
    editNotes,
    deleteAllJobApplications,
    updateEditStatus,
    updateJobStatus,
    getJobStatusCountPair,
    getApplicationsForLatestEightWeeks,
};
