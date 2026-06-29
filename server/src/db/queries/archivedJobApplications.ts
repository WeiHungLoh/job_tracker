import type { ArchivedJobApplication, JobStatus } from '../models.js';
import { pool } from '../connectDB.js';
import { hasAffectedRows, JOB_STATUS_SORT_ORDER } from './shared.js';

export const archiveJobApplication = async (jobId: number, userId: number): Promise<boolean> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const applicationResult = await client.query(
            `UPDATE job_applications
             SET is_archived = true, edit_status = false
             WHERE job_id = $1 AND user_id = $2 AND is_archived = false`,
            [jobId, userId]
        );

        if (!hasAffectedRows(applicationResult)) {
            await client.query('ROLLBACK');
            return false;
        }

        await client.query(
            `UPDATE interviews SET is_archived = true
             WHERE job_id = $1 AND user_id = $2 AND is_archived = false`,
            [jobId, userId]
        );
        await client.query('COMMIT');
        return true;
    } catch (error: unknown) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const unarchiveJobApplication = async (archivedJobId: number, userId: number): Promise<boolean> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const applicationResult = await client.query(
            `UPDATE job_applications SET is_archived = false
             WHERE job_id = $1 AND user_id = $2 AND is_archived = true`,
            [archivedJobId, userId]
        );

        if (!hasAffectedRows(applicationResult)) {
            await client.query('ROLLBACK');
            return false;
        }

        await client.query(
            `UPDATE interviews SET is_archived = false
             WHERE job_id = $1 AND user_id = $2 AND is_archived = true`,
            [archivedJobId, userId]
        );
        await client.query('COMMIT');
        return true;
    } catch (error: unknown) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getArchivedJobApplications = async (
    userId: number,
    jobStatuses: JobStatus[]
): Promise<ArchivedJobApplication[]> => {
    const result = await pool.query<ArchivedJobApplication>(
        `SELECT
            job_id AS archived_job_id,
            company_name,
            job_title,
            application_date,
            job_status,
            job_location,
            job_posting_url,
            notes
         FROM job_applications
         WHERE user_id = $1 AND is_archived = true
            AND job_status = ANY($2::text[])
         ORDER BY ${JOB_STATUS_SORT_ORDER},
            application_date DESC`,
        [userId, jobStatuses]
    );

    return result.rows;
};

export const deleteArchivedJobApplication = async (jobId: number, userId: number): Promise<boolean> => {
    const result = await pool.query(
        `DELETE FROM job_applications WHERE job_id = $1 AND user_id = $2 AND is_archived = true`,
        [jobId, userId]
    );
    return hasAffectedRows(result);
};

export const deleteAllArchivedJobApplications = async (userId: number): Promise<void> => {
    await pool.query(`DELETE FROM job_applications WHERE user_id = $1 AND is_archived = true`, [userId]);
};
