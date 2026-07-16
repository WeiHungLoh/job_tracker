import type { JobApplication, JobStatus, JobStatusCount, WeeklyApplicationCount } from '../models.js';
import { pool } from '../connectDB.js';
import { hasAffectedRows, JOB_STATUS_SORT_ORDER } from './shared.js';

export type UpdateApplicationStatusResult = 'active-interview' | 'not-found' | 'updated';

type PotentialDuplicateApplication = {
    company_name: string;
    job_title: string;
    application_date: Date;
};

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

export const findPotentialDuplicateApplication = async (
    userId: number,
    companyName: string,
    jobTitle: string,
    jobURL: string
): Promise<PotentialDuplicateApplication | undefined> => {
    const result = await pool.query<PotentialDuplicateApplication>(
        `SELECT
            company_name,
            job_title,
            application_date
         FROM job_applications
         WHERE user_id = $1
            AND (
                (
                    NULLIF(BTRIM($4::text), '') IS NOT NULL
                    AND NULLIF(BTRIM(job_posting_url), '') IS NOT NULL
                    AND BTRIM(job_posting_url) = BTRIM($4::text)
                )
                OR (
                    LOWER(BTRIM(REGEXP_REPLACE(company_name, '[[:space:]]+', ' ', 'g'))) =
                        LOWER(BTRIM(REGEXP_REPLACE($2::text, '[[:space:]]+', ' ', 'g')))
                    AND LOWER(BTRIM(REGEXP_REPLACE(job_title, '[[:space:]]+', ' ', 'g'))) =
                        LOWER(BTRIM(REGEXP_REPLACE($3::text, '[[:space:]]+', ' ', 'g')))
                )
            )
         ORDER BY
            CASE
                WHEN NULLIF(BTRIM($4::text), '') IS NOT NULL
                    AND NULLIF(BTRIM(job_posting_url), '') IS NOT NULL
                    AND BTRIM(job_posting_url) = BTRIM($4::text)
                THEN 0
                ELSE 1
            END ASC,
            is_archived ASC,
            application_date DESC,
            job_id ASC
         LIMIT 1`,
        [userId, companyName, jobTitle, jobURL]
    );

    return result.rows[0];
};

export const getJobApplications = async (userId: number, jobStatuses: JobStatus[]): Promise<JobApplication[]> => {
    const result = await pool.query<JobApplication>(
        `SELECT
            job_id,
            company_name,
            job_title,
            application_date,
            job_status,
            job_location,
            job_posting_url,
            notes
         FROM job_applications
         WHERE user_id = $1 AND is_archived = false
            AND job_status = ANY($2::text[])
         ORDER BY ${JOB_STATUS_SORT_ORDER},
            application_date DESC`,
        [userId, jobStatuses]
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
            WHERE user_id = $1
                AND is_archived = false
                AND application_date >= date_trunc('week', CURRENT_DATE) - interval '7 weeks'
                AND application_date < date_trunc('week', CURRENT_DATE) + interval '1 week'
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

export const updateApplicationStatus = async (
    jobStatus: JobStatus,
    jobId: number,
    userId: number
): Promise<UpdateApplicationStatusResult> => {
    const result = await pool.query<{ application_exists: boolean; application_updated: boolean }>(
        `WITH application AS (
            SELECT job_id
            FROM job_applications
            WHERE job_id = $2 AND user_id = $3 AND is_archived = false
        ),
        updated_application AS (
            UPDATE job_applications
            SET job_status = $1
            FROM application
            WHERE job_applications.job_id = application.job_id
                AND (
                    $1::text <> 'Applied'
                    OR job_applications.job_status = 'Applied'
                    OR NOT EXISTS (
                        SELECT 1
                        FROM interviews
                        WHERE interviews.job_id = job_applications.job_id
                            AND interviews.user_id = $3
                            AND interviews.is_archived = false
                    )
                )
            RETURNING 1
        )
        SELECT
            EXISTS(SELECT 1 FROM application) AS application_exists,
            EXISTS(SELECT 1 FROM updated_application) AS application_updated`,
        [jobStatus, jobId, userId]
    );

    if (result.rows[0]?.application_updated) {
        return 'updated';
    }
    return result.rows[0]?.application_exists ? 'active-interview' : 'not-found';
};
