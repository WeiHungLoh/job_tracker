import express from 'express'
const router = express.Router()
import { deleteAllJobInterviews, deleteJobInterview, getInterviews, insertInterview } from '../db/queries/interviews.js'

router.post('/add', async (req, res) => {
    const {jobId, interviewDate, interviewLocation, interviewType, notes} = req.body
    const userId = req.user.id

    try {
        await insertInterview(jobId, userId, interviewDate, interviewLocation, interviewType, notes)
        res.status(201).send('Successfully added an interview!')
    } catch (error) {
        res.status(500).send('Failed to add interview ' + error.message)
    }
})

router.get('/view', async (req, res) => {
    const userId = req.user.id
    
    try {
        const sortedInterviews = await getInterviews(userId)
        res.status(200).json(sortedInterviews)
    } catch (error) {
        res.status(500).send('Failed to load interviews ' + error.message)
    }
})

router.delete('/deleteall', async (req, res) => {
    const userId = req.user.id

    try {
        await deleteAllJobInterviews(userId)
        res.status(200).send('Deleted all interviews')
    } catch (error) {
        res.status(500).send('Error deleting interview ' + error.message)
    }
})

router.delete('/:id', async (req, res) => {
    // Since assignment object ID has been passed to param, retrieve it
    const { id } = req.params

    try {
        await deleteJobInterview(id)
        res.status(200).send('Deleted application')
    } catch (error) {
        res.status(500).send('Error deleting assignment ' + error.message)
    }
})

export default router
