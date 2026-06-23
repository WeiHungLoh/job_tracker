import type { User } from '../models.js';
import { pool } from '../connectDB.js';

const insertUser = async (email: string, hashed_password: string): Promise<void> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const res = await client.query<{ user_id: number }>(
            `INSERT INTO users (email, hashed_password) VALUES ($1, $2) RETURNING user_id`,
            [email, hashed_password]
        );
        await client.query(`INSERT INTO user_preferences (user_id) VALUES ($1)`, [res.rows[0].user_id]);
        await client.query('COMMIT');
    } catch (error: unknown) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const findUser = async (email: string): Promise<boolean> => {
    const res = await pool.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
    return (res.rowCount ?? 0) > 0;
};

const findUserInfo = async (email: string): Promise<User | undefined> => {
    const res = await pool.query<User>(`SELECT * FROM users WHERE email = $1`, [email]);

    return res.rows[0];
};

export { insertUser, findUser, findUserInfo };
