import type {
    CreateApplicationRequest,
    CreateApplicationResponse,
    EmptyResponse,
    JobIdParams,
    ListApplicationsResponse,
    ListJobStatusCountsResponse,
    ListWeeklyApplicationsResponse,
    UpdateEditStatusRequest,
    UpdateJobStatusRequest,
    UpdateNotesRequest
} from './models.js'
import type { Request, Response } from 'express'
import {
    deleteAllJobApplications,
    deleteJobApplication,
    editNotes,
    getApplicationsForLatestEightWeeks,
    getJobApplications,
    getJobStatusCountPair,
    insertJobApplication,
    updateEditStatus,
    updateJobStatus
} from '../../db/queries/jobApplications.js'
import { handleRouteError, sendError } from '../../http/responses.js'
import { isJobStatus, isNonEmptyString, isPositiveInteger, isString, isValidDate } from '../../http/validation.js'
import express from 'express'

const router = express.Router()

router.post('/', async (
    req: Request<Record<string, never>, CreateApplicationResponse, CreateApplicationRequest>,
    res: Response<CreateApplicationResponse>
): Promise<void> => {
    const { companyName, jobTitle, appDate, jobStatus, jobLocation, jobURL } = req.body

    if (
        !isNonEmptyString(companyName) ||
        !isNonEmptyString(jobTitle) ||
        !isValidDate(appDate) ||
        !isJobStatus(jobStatus) ||
        !isString(jobLocation) ||
        !isString(jobURL)
    ) {
        sendError(res, 422, 'Company name, job title, application date, and a supported job status are required.')
        return
    }

    try {
        await insertJobApplication(
            req.user.id,
            companyName,
            jobTitle,
            appDate,
            jobStatus,
            jobLocation,
            jobURL
        )
        res.status(201).send('Successfully added a job application!')
    } catch (error: unknown) {
        handleRouteError(res, error, 'Unable to create the job application.')
    }
})

router.get('/', async (
    req: Request<Record<string, never>, ListApplicationsResponse>,
    res: Response<ListApplicationsResponse>
): Promise<void> => {
    try {
        res.status(200).json(await getJobApplications(req.user.id))
    } catch (error: unknown) {
        handleRouteError(res, error, 'Unable to load job applications.')
    }
})

router.get('/status-counts', async (
    req: Request<Record<string, never>, ListJobStatusCountsResponse>,
    res: Response<ListJobStatusCountsResponse>
): Promise<void> => {
    try {
        res.status(200).json(await getJobStatusCountPair(req.user.id))
    } catch (error: unknown) {
        handleRouteError(res, error, 'Unable to load job application status counts.')
    }
})

router.get('/weekly-counts', async (
    req: Request<Record<string, never>, ListWeeklyApplicationsResponse>,
    res: Response<ListWeeklyApplicationsResponse>
): Promise<void> => {
    try {
        res.status(200).json(await getApplicationsForLatestEightWeeks(req.user.id))
    } catch (error: unknown) {
        handleRouteError(res, error, 'Unable to load weekly job application counts.')
    }
})

router.delete('/', async (
    req: Request<Record<string, never>, EmptyResponse>,
    res: Response<EmptyResponse>
): Promise<void> => {
    try {
        await deleteAllJobApplications(req.user.id)
        res.sendStatus(204)
    } catch (error: unknown) {
        handleRouteError(res, error, 'Unable to delete job applications.')
    }
})

router.delete('/:jobId', async (
    req: Request<JobIdParams, EmptyResponse>,
    res: Response<EmptyResponse>
): Promise<void> => {
    if (!isPositiveInteger(req.params.jobId)) {
        sendError(res, 422, 'Job application ID must be a positive integer.')
        return
    }

    try {
        if (!await deleteJobApplication(req.params.jobId, req.user.id)) {
            sendError(res, 404, 'Job application not found.')
            return
        }
        res.sendStatus(204)
    } catch (error: unknown) {
        handleRouteError(res, error, 'Unable to delete the job application.')
    }
})

router.patch('/:jobId/notes', async (
    req: Request<JobIdParams, EmptyResponse, UpdateNotesRequest>,
    res: Response<EmptyResponse>
): Promise<void> => {
    if (!isPositiveInteger(req.params.jobId)) {
        sendError(res, 422, 'Job application ID must be a positive integer.')
        return
    }
    if (!isString(req.body.notes)) {
        sendError(res, 422, 'Notes must be a string.')
        return
    }

    try {
        if (!await editNotes(req.params.jobId, req.user.id, req.body.notes)) {
            sendError(res, 404, 'Job application not found.')
            return
        }
        res.sendStatus(204)
    } catch (error: unknown) {
        handleRouteError(res, error, 'Unable to update job application notes.')
    }
})

router.patch('/:jobId/edit-status', async (
    req: Request<JobIdParams, EmptyResponse, UpdateEditStatusRequest>,
    res: Response<EmptyResponse>
): Promise<void> => {
    if (!isPositiveInteger(req.params.jobId)) {
        sendError(res, 422, 'Job application ID must be a positive integer.')
        return
    }
    if (typeof req.body.editStatus !== 'boolean') {
        sendError(res, 422, 'Edit status must be a boolean.')
        return
    }

    try {
        if (!await updateEditStatus(req.body.editStatus, req.params.jobId, req.user.id)) {
            sendError(res, 404, 'Job application not found.')
            return
        }
        res.sendStatus(204)
    } catch (error: unknown) {
        handleRouteError(res, error, 'Unable to change the job application edit status.')
    }
})

router.patch('/:jobId/status', async (
    req: Request<JobIdParams, EmptyResponse, UpdateJobStatusRequest>,
    res: Response<EmptyResponse>
): Promise<void> => {
    if (!isPositiveInteger(req.params.jobId)) {
        sendError(res, 422, 'Job application ID must be a positive integer.')
        return
    }
    if (!isJobStatus(req.body.jobStatus)) {
        sendError(res, 422, 'A supported job status is required.')
        return
    }

    try {
        if (!await updateJobStatus(req.body.jobStatus, req.params.jobId, req.user.id)) {
            sendError(res, 404, 'Job application not found.')
            return
        }
        res.sendStatus(204)
    } catch (error: unknown) {
        handleRouteError(res, error, 'Unable to change the job application status.')
    }
})

export default router
