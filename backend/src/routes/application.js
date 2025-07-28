import {
    deleteAllJobApplications,
    deleteJobApplication,
    editNotes,
    getApplicationsForLatestEightWeeks,
    getJobApplications,
    getJobStatusCountPair,
    insertJobApplication,
    toggleEditStatus,
    toggleJobStatus
} from '../db/queries/jobApplications.js'
import express from 'express'
const router = express.Router()

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
        res.status(500).send('Failed to load applications ' + error.message)
    }
})

router.get('/jobstatuscount', async (req, res) => {
    const userId = req.user.id
    try {
        const jobStatusCountPair = await getJobStatusCountPair(userId)
        res.status(200).json(jobStatusCountPair)
    } catch (error) {
        res.status(500).send('Failed to load applications ' + error.message)
    }
})

router.get('/jobapplicationsbyweek', async (req, res) => {
    const userId = req.user.id
    try {
        const jobApplicationsPerWeek = await getApplicationsForLatestEightWeeks(userId)
        res.status(200).json(jobApplicationsPerWeek)
    } catch (error) {
        res.status(500).send('Failed to load applications ' + error.message)
    }
})

router.delete('/deleteall', async (req, res) => {
    const userId = req.user.id

    try {
        await deleteAllJobApplications(userId)
        res.status(200).send('Deleted all applications')
    } catch (error) {
        res.status(500).send('Error deleting application ' + error.message)
    }
})

router.delete('/:jobId', async (req, res) => {
    // Since assignment object ID has been passed to param, retrieve it
    const { jobId } = req.params
    const userId = req.user.id

    try {
        await deleteJobApplication(jobId, userId)
        res.status(200).send('Deleted application')
    } catch (error) {
        res.status(500).send('Error deleting assignment ' + error.message)
    }
})

router.put('/editnotes', async (req, res) => {
    const userId = req.user.id
    const { jobId, notes } = req.body

    try {
        await editNotes(jobId, userId, notes)
        res.status(200).send('Updated notes')
    } catch (error) {
        res.status(500).send('Error updating notes ' + error.message)
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
