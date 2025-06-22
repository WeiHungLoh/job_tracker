import express from 'express'
import { getArchivedJobInterviews, deleteArchivedJobInterview, deleteAllCorrArchivedJobInterviews } from '../db/queries/archivedInterviews.js'
const router = express.Router()

router.get('/view', async (req, res) => {
    const userId = req.user.id
    try {
        // Finds all assignments for a specific user then sort them in ascending order by application date
        const sortedInterviews = await getArchivedJobInterviews(userId)
        res.status(200).json(sortedInterviews)
    } catch (error) {
        res.status(500).send('Failed to load archived applications ' + error.message)
    }
})

router.delete('/deleteall', async (req, res) => {
    const userId = req.user.id

    try {
        await deleteAllCorrArchivedJobInterviews(userId)
        res.status(200).send('Deleted all archived interviews')
    } catch (error) {
        res.status(500).send('Error deleting archived interviews ' + error.message)
    }
})

router.delete('/:interviewId', async (req, res) => {
    // Since assignment object ID has been passed to param, retrieve it
    const { interviewId } = req.params
    const userId = req.user.id

    try {
        await deleteArchivedJobInterview(interviewId, userId)
        res.status(200).send('Deleted archived interview')
    } catch (error) {
        res.status(500).send('Error deleting archived interview ' + error.message)
    }
})

export default router
