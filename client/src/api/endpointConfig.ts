import type { EndpointConfigEntry } from './models';
import { FieldType } from './models';

export const endpointConfig = {
    ping: {
        wake: { url: '/ping', verb: 'GET' },
    },
    authentication: {
        signIn: { url: '/authentication/sessions', verb: 'POST' },
        signUp: { url: '/authentication/users', verb: 'POST' },
        verify: { url: '/authentication/sessions/current', verb: 'GET' },
        logout: { url: '/authentication/sessions/current', verb: 'DELETE' },
    },
    application: {
        listApplications: {
            url: '/job-applications',
            verb: 'GET',
            fieldMap: { jobStatus: FieldType.query },
        },
        listWeeklyApplications: { url: '/job-applications/weekly-counts', verb: 'GET' },
        listJobStatusCounts: { url: '/job-applications/status-counts', verb: 'GET' },
        createApplication: { url: '/job-applications', verb: 'POST' },
        deleteApplication: {
            url: '/job-applications/:applicationId',
            verb: 'DELETE',
            fieldMap: { applicationId: FieldType.path },
        },
        deleteAllApplications: { url: '/job-applications', verb: 'DELETE' },
        updateNotes: { url: '/job-applications/:jobId/notes', verb: 'PATCH', fieldMap: { jobId: FieldType.path } },
        updateEditStatus: {
            url: '/job-applications/:jobId/edit-status',
            verb: 'PATCH',
            fieldMap: { jobId: FieldType.path },
        },
        updateJobStatus: { url: '/job-applications/:jobId/status', verb: 'PATCH', fieldMap: { jobId: FieldType.path } },
    },
    interview: {
        listInterviews: { url: '/job-interviews', verb: 'GET' },
        createInterview: { url: '/job-interviews', verb: 'POST' },
        deleteInterview: {
            url: '/job-interviews/:interviewId',
            verb: 'DELETE',
            fieldMap: { interviewId: FieldType.path },
        },
        deleteAllInterviews: { url: '/job-interviews', verb: 'DELETE' },
    },
    archivedApplication: {
        listApplications: {
            url: '/archived-job-applications',
            verb: 'GET',
            fieldMap: { jobStatus: FieldType.query },
        },
        archiveApplication: { url: '/archived-job-applications', verb: 'POST' },
        deleteApplication: {
            url: '/archived-job-applications/:archivedApplicationId',
            verb: 'DELETE',
            fieldMap: { archivedApplicationId: FieldType.path },
        },
        deleteAllApplications: { url: '/archived-job-applications', verb: 'DELETE' },
        unarchiveApplication: {
            url: '/archived-job-applications/:archivedJobId/restore',
            verb: 'POST',
            fieldMap: { archivedJobId: FieldType.path },
        },
    },
    archivedInterview: {
        listInterviews: { url: '/archived-job-interviews', verb: 'GET' },
        deleteInterview: {
            url: '/archived-job-interviews/:interviewId',
            verb: 'DELETE',
            fieldMap: { interviewId: FieldType.path },
        },
        deleteAllInterviews: { url: '/archived-job-interviews', verb: 'DELETE' },
    },
} satisfies Record<string, Record<string, EndpointConfigEntry>>;
