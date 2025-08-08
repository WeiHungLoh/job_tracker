import { pool } from '../connectDB.js'

const insertUser = async (
    email,
    hashed_password,
    sorting_preferences,
) => {
    await pool.query(
        `INSERT INTO users (email, hashed_password, sorting_preferences) VALUES ($1, $2, $3)`,
        [email, hashed_password, sorting_preferences]
    )
}

const findUser = async (email) => {
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

const findUserInfo = async (email) => {
    const res = await pool.query(
        `SELECT * FROM users WHERE email = $1`, [email]
    )

    return res.rows[0]
}

export { insertUser, findUser, findUserInfo }
