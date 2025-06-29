import {
  deleteAllArchivedJobApplications,
  deleteArchivedJobApplication,
  getArchivedJobApplications,
  insertArchivedJobApplication,
  removeArchivedJobApplication
} from '../db/queries/archivedJobApplications.js'
import express from 'express'
const router = express.Router()

router.post('/archive', async (req, res) => {
    const { jobId } = req.body
    const userId = req.user.id

    try {
        await insertArchivedJobApplication(jobId, userId)
        res.status(201).send('Successfully archived!')
    } catch (error) {
        res.status(500).send('Failed to archive a job application ' + error.message)
    }
})

router.post('/unarchive', async (req, res) => {
    const { archivedJobId } = req.body
    const userId = req.user.id

    try {
        await removeArchivedJobApplication(archivedJobId, userId)
        res.status(201).send('Successfully unarchived!')
    } catch (error) {
        res.status(500).send('Failed to unarchive a job application ' + error.message)
    }
})

router.get('/view', async (req, res) => {
    const userId = req.user.id
    try {
        // Finds all assignments for a specific user then sort them in ascending order by application date
        const sortedApplications = await getArchivedJobApplications(userId)
        res.status(200).json(sortedApplications)
    } catch (error) {
        res.status(500).send('Failed to load archived applications ' + error.message)
    }
})

router.delete('/deleteall', async (req, res) => {
    const userId = req.user.id

    try {
        await deleteAllArchivedJobApplications(userId)
        res.status(200).send('Deleted all archived applications')
    } catch (error) {
        res.status(500).send('Error deleting archived applications' + error.message)
    }
})

router.delete('/:jobId', async (req, res) => {
    // Since assignment object ID has been passed to param, retrieve it
    const { jobId } = req.params
    const userId = req.user.id

    try {
        await deleteArchivedJobApplication(jobId, userId)
        res.status(200).send('Deleted archived application')
    } catch (error) {
        res.status(500).send('Error deleting archived application ' + error.message)
    }
})

export default router
