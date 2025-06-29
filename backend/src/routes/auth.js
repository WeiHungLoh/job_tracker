import { findUser, findUserInfo, insertUser } from '../db/queries/users.js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'
const router = express.Router()
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

        // Saves token inside cookie to prevent XSS
        res.cookie('token', ACCESS_TOKEN, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 3 * 60 * 60 * 1000
        })

        res.status(200).json({ message: 'Successfully signed in' })
    } catch (error) {
        res.status(500).send('Server error: ' + error.message)
    }
})

router.get('/check', async (req, res) => {
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({ message: 'No token found. Please login' })
    }

    try {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        res.status(200).json({ message: 'Authenticated user' })
    } catch (error) {
        res.clearCookie('token')
        res.status(404).json({ message: 'Invalid token. Please login' })
    }
})

router.get('/logout', async (req, res) => {
    res.clearCookie('token')
    res.status(200).json({ message: 'Successfully logged out '})
})

export default router
