import type { JobStatusCount, WeeklyApplicationCount } from "../dashboard/models"

export type EntityId = number

export type JobStatus = "Accepted" | "Applied" | "Declined" | "Ghosted" | "Interview" | "Offer" | "Rejected"

export type JobApplication = {
    job_id: EntityId
    company_name: string
    job_title: string
    application_date: string
    job_status: JobStatus
    edit_status: boolean
    job_location: string
    job_posting_url: string
    notes: string
}

export type ListApplicationsRequest = null
export type ListApplicationsResponse = JobApplication[]

export type ListWeeklyApplicationsRequest = null
export type ListWeeklyApplicationsResponse = WeeklyApplicationCount[]

export type ListJobStatusCountsRequest = null
export type ListJobStatusCountsResponse = JobStatusCount[]

export type CreateApplicationRequest = {
    companyName: string
    jobTitle: string
    appDate: Date
    jobStatus: string
    jobLocation: string
    jobURL: string
}
export type CreateApplicationResponse = string

export type DeleteApplicationRequest = {
    applicationId: EntityId
}
export type DeleteApplicationResponse = null

export type DeleteAllApplicationsRequest = null
export type DeleteAllApplicationsResponse = null

export type UpdateNotesRequest = {
    jobId: EntityId
    notes: string
}
export type UpdateNotesResponse = null

export type UpdateEditStatusRequest = {
    jobId: EntityId
    editStatus: boolean
}
export type UpdateEditStatusResponse = null

export type UpdateJobStatusRequest = {
    jobId: EntityId
    jobStatus: JobStatus
}
export type UpdateJobStatusResponse = null
