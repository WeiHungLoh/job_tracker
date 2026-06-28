export const endpointConfig = {
    ping: {
        wake: { url: '/ping', verb: 'GET' },
    },
    authentication: {
        signIn: { url: '/authentication/sessions', verb: 'POST' },
        signUp: { url: '/authentication/users', verb: 'POST' },
        verify: { url: '/authentication/sessions/current', verb: 'GET' },
        refresh: { url: '/authentication/sessions/refresh', verb: 'POST' },
        logout: { url: '/authentication/sessions/current', verb: 'DELETE' },
    },
    application: {
        listApplications: {
            url: '/job-applications',
            verb: 'GET',
            fieldMap: { jobStatus: 'query' },
        },
        listWeeklyApplications: { url: '/job-applications/weekly-counts', verb: 'GET' },
        listJobStatusCounts: { url: '/job-applications/status-counts', verb: 'GET' },
        createApplication: { url: '/job-applications', verb: 'POST' },
        deleteApplication: {
            url: '/job-applications/:jobId',
            verb: 'DELETE',
            fieldMap: { jobId: 'path' },
        },
        deleteAllApplications: { url: '/job-applications', verb: 'DELETE' },
        updateNotes: { url: '/job-applications/:jobId/notes', verb: 'PATCH', fieldMap: { jobId: 'path' } },
        updateEditStatus: {
            url: '/job-applications/:jobId/edit-status',
            verb: 'PATCH',
            fieldMap: { jobId: 'path' },
        },
        updateJobStatus: { url: '/job-applications/:jobId/status', verb: 'PATCH', fieldMap: { jobId: 'path' } },
    },
    interview: {
        listInterviews: { url: '/job-interviews', verb: 'GET' },
        createInterview: { url: '/job-interviews', verb: 'POST' },
        deleteInterview: {
            url: '/job-interviews/:interviewId',
            verb: 'DELETE',
            fieldMap: { interviewId: 'path' },
        },
        deleteAllInterviews: { url: '/job-interviews', verb: 'DELETE' },
    },
    archivedApplication: {
        listApplications: {
            url: '/archived-job-applications',
            verb: 'GET',
            fieldMap: { jobStatus: 'query' },
        },
        archiveApplication: { url: '/archived-job-applications', verb: 'POST' },
        deleteApplication: {
            url: '/archived-job-applications/:archivedJobId',
            verb: 'DELETE',
            fieldMap: { archivedJobId: 'path' },
        },
        deleteAllApplications: { url: '/archived-job-applications', verb: 'DELETE' },
        unarchiveApplication: {
            url: '/archived-job-applications/:archivedJobId/restore',
            verb: 'POST',
            fieldMap: { archivedJobId: 'path' },
        },
    },
    archivedInterview: {
        listInterviews: { url: '/archived-job-interviews', verb: 'GET' },
        deleteInterview: {
            url: '/archived-job-interviews/:archivedInterviewId',
            verb: 'DELETE',
            fieldMap: { archivedInterviewId: 'path' },
        },
        deleteAllInterviews: { url: '/archived-job-interviews', verb: 'DELETE' },
    },
    userPreferences: {
        get: { url: '/user-preferences', verb: 'GET' },
        update: { url: '/user-preferences', verb: 'PATCH' },
    },
} as const;
