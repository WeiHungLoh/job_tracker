import type {
    JobStatus,
    OfferDecisionFilter,
    OfferDecisionApplication,
    OfferDetails,
    OfferDecisionWorkspace,
    OfferEvaluation,
    OfferEvaluationInput,
} from '../models.js';
import { pool } from '../connectDB.js';

type OfferDecisionRow = {
    job_id: number;
    company_name: string;
    job_title: string;
    job_status: JobStatus;
    application_date: Date | string;
    evaluation_job_id: number | null;
    career_growth_rating: number | null;
    company_culture_fit_rating: number | null;
    work_life_balance_rating: number | null;
    compensation_rating: number | null;
    currency: string | null;
    monthly_base_salary: number | null;
    bonus: string | null;
    annual_leave_days: number | null;
    work_arrangement: OfferDetails['work_arrangement'] | null;
    decision_deadline: Date | string | null;
    pros: string | null;
    concerns: string | null;
    updated_at: Date | null;
};

type LockedApplicationRow = {
    job_id: number;
    job_status: JobStatus;
    application_date: Date | string;
};

export type SaveOfferEvaluationResult = 'saved' | 'application_unavailable' | 'deadline_before_application';

const toISOString = (value: Date | string): string => (value instanceof Date ? value.toISOString() : value);

const toEvaluation = (row: OfferDecisionRow): OfferEvaluation | null => {
    if (row.evaluation_job_id === null || row.updated_at === null) {
        return null;
    }

    return {
        job_id: row.evaluation_job_id,
        ratings: {
            career_growth: Number(row.career_growth_rating),
            company_culture_fit: Number(row.company_culture_fit_rating),
            work_life_balance: Number(row.work_life_balance_rating),
            compensation: Number(row.compensation_rating),
        },
        details: {
            currency: row.currency ?? 'SGD',
            monthly_base_salary: row.monthly_base_salary,
            bonus: row.bonus ?? '',
            annual_leave_days: row.annual_leave_days,
            work_arrangement: row.work_arrangement ?? '',
            decision_deadline: row.decision_deadline ? toISOString(row.decision_deadline) : '',
            pros: row.pros ?? '',
            concerns: row.concerns ?? '',
        },
        updated_at: row.updated_at,
    };
};

const toApplication = (row: OfferDecisionRow): OfferDecisionApplication => ({
    job_id: row.job_id,
    company_name: row.company_name,
    job_title: row.job_title,
    job_status: row.job_status,
    application_date: toISOString(row.application_date),
    evaluation: toEvaluation(row),
});

export const getOfferDecisionWorkspace = async (
    userId: number,
    isArchived: boolean,
    filters: readonly OfferDecisionFilter[]
): Promise<OfferDecisionWorkspace> => {
    const result = await pool.query<OfferDecisionRow>(
        `SELECT
            applications.job_id,
            applications.company_name,
            applications.job_title,
            applications.job_status,
            applications.application_date,
            evaluations.job_id AS evaluation_job_id,
            evaluations.career_growth_rating,
            evaluations.company_culture_fit_rating,
            evaluations.work_life_balance_rating,
            evaluations.compensation_rating,
            evaluations.currency,
            evaluations.monthly_base_salary,
            evaluations.bonus,
            evaluations.annual_leave_days,
            evaluations.work_arrangement,
            evaluations.decision_deadline,
            evaluations.pros,
            evaluations.concerns,
            evaluations.updated_at
        FROM job_applications AS applications
        LEFT JOIN offer_evaluations AS evaluations
            ON evaluations.job_id = applications.job_id
            AND evaluations.user_id = applications.user_id
        WHERE applications.user_id = $1
            AND applications.is_archived = $2
            AND (
                ($2 = false AND (
                    applications.job_status = 'Offer'
                    OR evaluations.job_id IS NOT NULL
                ))
                OR ($2 = true AND evaluations.job_id IS NOT NULL)
            )
            AND (
                (
                    'Offers to Evaluate' = ANY($3::text[])
                    AND $2 = false
                    AND applications.job_status = 'Offer'
                    AND evaluations.job_id IS NULL
                )
                OR (
                    'Evaluated Offers' = ANY($3::text[])
                    AND applications.job_status = 'Offer'
                    AND evaluations.job_id IS NOT NULL
                    AND (
                        evaluations.decision_deadline IS NULL
                        OR evaluations.decision_deadline >= NOW()
                    )
                )
                OR (
                    'Expired Evaluated Offers' = ANY($3::text[])
                    AND applications.job_status = 'Offer'
                    AND evaluations.job_id IS NOT NULL
                    AND evaluations.decision_deadline < NOW()
                )
                OR (
                    'Previous Evaluations' = ANY($3::text[])
                    AND applications.job_status <> 'Offer'
                    AND evaluations.job_id IS NOT NULL
                )
            )
        ORDER BY
            CASE
                WHEN applications.job_status = 'Offer' THEN 1
                ELSE 2
            END,
            applications.company_name,
            applications.job_title,
            applications.job_id`,
        [userId, isArchived, filters]
    );

    return { applications: result.rows.map(toApplication) };
};

const upsertOfferEvaluation = async (
    query: (sql: string, values?: unknown[]) => Promise<unknown>,
    userId: number,
    jobId: number,
    request: OfferEvaluationInput
): Promise<void> => {
    await query(
        `INSERT INTO offer_evaluations (
            job_id,
            user_id,
            career_growth_rating,
            company_culture_fit_rating,
            work_life_balance_rating,
            compensation_rating,
            currency,
            monthly_base_salary,
            bonus,
            annual_leave_days,
            work_arrangement,
            decision_deadline,
            pros,
            concerns
        ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (job_id, user_id) DO UPDATE SET
            career_growth_rating = EXCLUDED.career_growth_rating,
            company_culture_fit_rating = EXCLUDED.company_culture_fit_rating,
            work_life_balance_rating = EXCLUDED.work_life_balance_rating,
            compensation_rating = EXCLUDED.compensation_rating,
            currency = EXCLUDED.currency,
            monthly_base_salary = EXCLUDED.monthly_base_salary,
            bonus = EXCLUDED.bonus,
            annual_leave_days = EXCLUDED.annual_leave_days,
            work_arrangement = EXCLUDED.work_arrangement,
            decision_deadline = EXCLUDED.decision_deadline,
            pros = EXCLUDED.pros,
            concerns = EXCLUDED.concerns,
            updated_at = CURRENT_TIMESTAMP`,
        [
            jobId,
            userId,
            request.ratings.career_growth,
            request.ratings.company_culture_fit,
            request.ratings.work_life_balance,
            request.ratings.compensation,
            request.details.currency,
            request.details.monthly_base_salary,
            request.details.bonus,
            request.details.annual_leave_days,
            request.details.work_arrangement,
            request.details.decision_deadline || null,
            request.details.pros,
            request.details.concerns,
        ]
    );
};

export const deleteOfferEvaluation = async (userId: number, jobId: number): Promise<boolean> => {
    const result = await pool.query(
        `DELETE FROM offer_evaluations AS evaluations
        USING job_applications AS applications
        WHERE evaluations.job_id = $2
            AND evaluations.user_id = $1
            AND applications.job_id = evaluations.job_id
            AND applications.user_id = evaluations.user_id
        RETURNING evaluations.job_id`,
        [userId, jobId]
    );

    return result.rowCount === 1;
};

export const deleteAllOfferEvaluations = async (userId: number, isArchived: boolean): Promise<void> => {
    await pool.query(
        `DELETE FROM offer_evaluations AS evaluations
        USING job_applications AS applications
        WHERE evaluations.user_id = $1
            AND applications.job_id = evaluations.job_id
            AND applications.user_id = evaluations.user_id
            AND applications.is_archived = $2`,
        [userId, isArchived]
    );
};

export const saveOfferEvaluation = async (
    userId: number,
    jobId: number,
    request: OfferEvaluationInput
): Promise<SaveOfferEvaluationResult> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const applicationsResult = await client.query<LockedApplicationRow>(
            `SELECT
                applications.job_id,
                applications.job_status,
                applications.application_date
            FROM job_applications AS applications
            WHERE applications.user_id = $1
                AND applications.job_id = $2
                AND applications.is_archived = false
            FOR UPDATE OF applications`,
            [userId, jobId]
        );
        const application = applicationsResult.rows[0];

        if (!application || application.job_status !== 'Offer') {
            await client.query('ROLLBACK');
            return 'application_unavailable';
        }

        if (new Date(request.details.decision_deadline).getTime() < new Date(application.application_date).getTime()) {
            await client.query('ROLLBACK');
            return 'deadline_before_application';
        }

        await upsertOfferEvaluation(client.query.bind(client), userId, jobId, request);
        await client.query('COMMIT');
        return 'saved';
    } catch (error: unknown) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
