import type { ArchivedJobApplication, JobStatus } from '../models.js';
import { pool } from '../connectDB.js';

const archiveJobApplication = async (jobId: string | number, userId: number): Promise<boolean> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const applicationResult = await client.query(
            `UPDATE job_applications
             SET is_archived = true, edit_status = false
             WHERE job_id = $1 AND user_id = $2 AND is_archived = false
             RETURNING job_id`,
            [jobId, userId]
        );

        if (applicationResult.rowCount === 0) {
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

const unarchiveJobApplication = async (archivedJobId: string | number, userId: number): Promise<boolean> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const applicationResult = await client.query(
            `UPDATE job_applications SET is_archived = false
             WHERE job_id = $1 AND user_id = $2 AND is_archived = true
             RETURNING job_id`,
            [archivedJobId, userId]
        );

        if (applicationResult.rowCount === 0) {
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

const getArchivedJobApplications = async (userId: number): Promise<ArchivedJobApplication[]> => {
    const res = await pool.query<ArchivedJobApplication>(
        `SELECT
            job_id AS archived_job_id,
            user_id,
            company_name,
            job_title,
            application_date,
            created_at,
            job_status,
            job_location,
            job_posting_url,
            notes
         FROM job_applications
         WHERE user_id = $1 AND is_archived = true
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

const deleteArchivedJobApplication = async (jobId: string | number, userId: number): Promise<boolean> => {
    const result = await pool.query(
        `DELETE FROM job_applications WHERE job_id = $1 AND user_id = $2 AND is_archived = true`,
        [jobId, userId]
    );
    return (result.rowCount ?? 0) > 0;
};

const deleteAllArchivedJobApplications = async (userId: number): Promise<void> => {
    await pool.query(`DELETE FROM job_applications WHERE user_id = $1 AND is_archived = true`, [userId]);
};

export {
    archiveJobApplication,
    getArchivedJobApplications,
    deleteArchivedJobApplication,
    deleteAllArchivedJobApplications,
    unarchiveJobApplication,
};
