import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { findUserInfo, findUser, insertUser } from '../db/queries/users.js'
const router = express.Router();
dotenv.config()

router.post('/signup', async (req, res) => {
    const { email, password } = req.body

    try {
        const isExistingUser = await findUser(email)

        if (isExistingUser) {
            return res.status(400).send('User already exists')
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        await insertUser(email, hashedPassword, 'DEFAULT')

        res.status(201).send('User successfully registered')
    } catch (error) {
        res.status(500).send('Server error: ' + error.message)
    }
})

router.post('/signin', async (req, res) => {
    const { email, password } = req.body

    try {
        const isExistingUser = await findUser(email)

        if (!isExistingUser) {
            return res.status(404).json({ message: 'User does not exist. Please create an account' })
        }

        const userInfo = await findUserInfo(email)
        const hashed_password = userInfo.hashed_password

        const isPasswordMatch = await bcrypt.compare(password, hashed_password)

        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Incorrect password' })
        }

        const userId = userInfo.user_id
        const userEmail = userInfo.email
        const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET
        const ACCESS_TOKEN = jwt.sign(
            {
                id: userId,
                email: userEmail
            },
            ACCESS_TOKEN_SECRET,
            { expiresIn: '3h' }
        )
        res.status(200).json({ message: 'Successfully signed in', token: ACCESS_TOKEN })
    } catch (error) {
        res.status(500).send('Server error: ' + error.message)
    }
})

export default router
