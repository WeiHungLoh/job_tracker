import type { EntityId, JobApplication } from "../jobApplication/models"
import type { JobInterview } from "../interview/models"

export type ArchivedJobApplication = Omit<JobApplication, "job_id" | "edit_status"> & {
    archived_job_id: EntityId
}

export type ArchivedJobInterview = Omit<JobInterview, "interview_id" | "job_id"> & {
    archived_interview_id: EntityId
    archived_job_id: EntityId
}

export type ListArchivedApplicationsRequest = null
export type ListArchivedApplicationsResponse = ArchivedJobApplication[]

export type ArchiveApplicationRequest = {
    jobId: EntityId
}
export type ArchiveApplicationResponse = string

export type DeleteArchivedApplicationRequest = {
    archivedApplicationId: EntityId
}
export type DeleteArchivedApplicationResponse = null

export type DeleteAllArchivedApplicationsRequest = null
export type DeleteAllArchivedApplicationsResponse = null

export type UnarchiveApplicationRequest = {
    archivedJobId: EntityId
}
export type UnarchiveApplicationResponse = string

export type ListArchivedInterviewsRequest = null
export type ListArchivedInterviewsResponse = ArchivedJobInterview[]

export type DeleteArchivedInterviewRequest = {
    interviewId: EntityId
}
export type DeleteArchivedInterviewResponse = null

export type DeleteAllArchivedInterviewsRequest = null
export type DeleteAllArchivedInterviewsResponse = null
