import { pool } from '../connectDB.js'

const insertUser = async (
    email: string,
    hashed_password: string,
    sorting_preferences: 'DEFAULT' | 'APPLICATION_DATE'
) => {
    await pool.query(
        `INSERT INTO users (email, hashed_password, sorting_preferences) VALUES ($1, $2, $3)`,
        [email, hashed_password, sorting_preferences]
    )
}

const findUser = async (email: string) => {
    const res = await pool.query(
        `SELECT 1 FROM users WHERE email = $1`, [email]
    )

    const rowCount = res.rowCount
    if (rowCount === null || rowCount === undefined) {
        return false
    } else {
        return rowCount > 0
    }
}

export { insertUser, findUser }
