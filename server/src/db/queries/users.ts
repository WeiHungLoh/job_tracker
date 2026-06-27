import type { User } from '../models.js';
import { pool } from '../connectDB.js';
import { hasAffectedRows } from './shared.js';

export const insertUser = async (email: string, hashedPassword: string): Promise<void> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const result = await client.query<{ user_id: number }>(
            `INSERT INTO users (email, hashed_password) VALUES ($1, $2) RETURNING user_id`,
            [email, hashedPassword]
        );
        await client.query(`INSERT INTO user_preferences (user_id) VALUES ($1)`, [result.rows[0].user_id]);
        await client.query('COMMIT');
    } catch (error: unknown) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const findUser = async (email: string): Promise<boolean> => {
    const result = await pool.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
    return hasAffectedRows(result);
};

export const findUserInfo = async (email: string): Promise<User | undefined> => {
    const result = await pool.query<User>(`SELECT * FROM users WHERE email = $1`, [email]);

    return result.rows[0];
};
