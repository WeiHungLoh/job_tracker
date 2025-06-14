import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import express, { Request, Response, Router } from 'express'
import { findUser, insertUser } from '../db/queries/users.js'
const router = express.Router();
dotenv.config()

router.post('/signup', async (req: Request, res: Response) => {
    const { email, password } = req.body

    try {
        const isExistingUser = await findUser(email)

        if (isExistingUser) {
            return res.status(400).send('User already exists')
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        await insertUser(email, hashedPassword, 'DEFAULT')

        res.status(201).send('User successfully registered')
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).send('Server error: ' + error.message)
        } else {
            res.status(500).send('Server error: ' + error)
        }
    }
})

export default router
