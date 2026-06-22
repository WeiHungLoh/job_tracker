import type { User } from '../models.js';
import { pool } from '../connectDB.js';

const insertUser = async (email: string, hashed_password: string): Promise<void> => {
    await pool.query(`INSERT INTO users (email, hashed_password) VALUES ($1, $2)`, [email, hashed_password]);
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
