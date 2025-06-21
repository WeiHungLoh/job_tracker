import express from 'express'
const router = express.Router()
import { insertJobApplication, getJobApplications, deleteJobApplication, deleteAllJobApplications, toggleEditStatus, toggleJobStatus } from '../db/queries/jobApplications.js'
import { deleteAllCorrJobInterviews, deleteCorrJobInterview } from '../db/queries/interviews.js'

router.post('/add', async (req, res) => {
    const { companyName, jobTitle, appDate, jobStatus, jobLocation, jobURL } = req.body
    const userId = req.user.id

    try {
        await insertJobApplication(userId, companyName, jobTitle, appDate, jobStatus, jobLocation, jobURL)
        res.status(201).send('Successfully added a job application!')
    } catch (error) {
        res.status(500).send('Failed to add a job application ' + error.message)
    }
})

router.get('/view', async (req, res) => {
    const userId = req.user.id
    try {
        // Finds all assignments for a specific user then sort them in ascending order by application date
        const sortedApplications = await getJobApplications(userId)
        res.status(200).json(sortedApplications)
    } catch (error) {
        res.status(500).send('Failed to load assignments ' + error.message)
    }
})

router.delete('/deleteall', async (req, res) => {
    const userId = req.user.id

    try {
        await deleteAllJobApplications(userId)
        await deleteAllCorrJobInterviews(userId)
        res.status(200).send('Deleted all applications')
    } catch (error) {
        res.status(500).send('Error deleting application ' + error.message)
    }
})

router.delete('/:id', async (req, res) => {
    // Since assignment object ID has been passed to param, retrieve it
    const { id } = req.params
    const jobId = req.body

    try {
        await deleteJobApplication(id)
        await deleteCorrJobInterview(jobId)
        res.status(200).send('Deleted application')
    } catch (error) {
        res.status(500).send('Error deleting assignment ' + error.message)
    }
})

router.put('/toggleeditstatus', async (req, res) => {
    const userId = req.user.id
    const { jobId } = req.body

    try {
        await toggleEditStatus(jobId, userId)
        res.status(200).send('Changed edit status')
    } catch (error) {
        res.status(500).send('Error changing edit status ' + error.message)
    }
})

router.put('/togglejobstatus', async (req, res) => {
    const userId = req.user.id
    const { jobStatus, jobId } = req.body

    try {
        await toggleJobStatus(jobStatus, jobId, userId)
        res.status(200).send('Changed job status')
    } catch (error) {
        res.status(500).send('Error changing job status ' + error.message)
    }
})

export default router
