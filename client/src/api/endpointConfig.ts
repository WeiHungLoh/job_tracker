export const endpointConfig = {
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
            fieldMap: { jobStatuses: 'query' },
        },
        listWeeklyApplications: { url: '/job-applications/weekly-counts', verb: 'GET' },
        listJobStatusCounts: { url: '/job-applications/status-counts', verb: 'GET' },
        getSummary: { url: '/job-applications/summary', verb: 'GET' },
        createApplication: { url: '/job-applications', verb: 'POST' },
        deleteApplication: {
            url: '/job-applications/:jobId',
            verb: 'DELETE',
            fieldMap: { jobId: 'path' },
        },
        deleteAllApplications: { url: '/job-applications', verb: 'DELETE' },
        updateNotes: { url: '/job-applications/:jobId/notes', verb: 'PATCH', fieldMap: { jobId: 'path' } },
        updateStatus: { url: '/job-applications/:jobId/status', verb: 'PATCH', fieldMap: { jobId: 'path' } },
    },
    interview: {
        listInterviews: { url: '/job-interviews', verb: 'GET' },
        getSummary: { url: '/job-interviews/summary', verb: 'GET' },
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
            fieldMap: { jobStatuses: 'query' },
        },
        archiveApplication: { url: '/archived-job-applications', verb: 'PATCH' },
        archiveAllApplications: { url: '/archived-job-applications/archive-all', verb: 'PATCH' },
        unarchiveAllApplications: { url: '/archived-job-applications/unarchive-all', verb: 'PATCH' },
        getSummary: { url: '/archived-job-applications/summary', verb: 'GET' },
        deleteApplication: {
            url: '/archived-job-applications/:archivedJobId',
            verb: 'DELETE',
            fieldMap: { archivedJobId: 'path' },
        },
        deleteAllApplications: { url: '/archived-job-applications', verb: 'DELETE' },
        unarchiveApplication: {
            url: '/archived-job-applications/:archivedJobId/restore',
            verb: 'PATCH',
            fieldMap: { archivedJobId: 'path' },
        },
    },
    archivedInterview: {
        listInterviews: { url: '/archived-job-interviews', verb: 'GET' },
        getSummary: { url: '/archived-job-interviews/summary', verb: 'GET' },
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
