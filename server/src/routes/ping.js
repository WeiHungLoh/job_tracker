// Serves as a dummy route to wake up backend hosted on free tier
import express from 'express'
const router = express.Router()

router.get('/ping', async (req, res) => {
    return res.status(200).send('testing')
})

export default router
