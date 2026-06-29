import type {
    ArchiveApplicationRequest,
    ArchiveApplicationResponse,
    DeleteAllArchivedApplicationsRequest,
    DeleteAllArchivedApplicationsResponse,
    DeleteAllArchivedInterviewsRequest,
    DeleteAllArchivedInterviewsResponse,
    DeleteArchivedApplicationRequest,
    DeleteArchivedApplicationResponse,
    DeleteArchivedInterviewRequest,
    DeleteArchivedInterviewResponse,
    ListArchivedApplicationsRequest,
    ListArchivedApplicationsResponse,
    ListArchivedInterviewsRequest,
    ListArchivedInterviewsResponse,
    UnarchiveApplicationRequest,
    UnarchiveApplicationResponse,
} from '../pages/archivedApplication/models';
import type {
    CreateApplicationRequest,
    CreateApplicationResponse,
    DeleteAllApplicationsRequest,
    DeleteAllApplicationsResponse,
    DeleteApplicationRequest,
    DeleteApplicationResponse,
    ListApplicationsRequest,
    ListApplicationsResponse,
    ListJobStatusCountsRequest,
    ListJobStatusCountsResponse,
    ListWeeklyApplicationsRequest,
    ListWeeklyApplicationsResponse,
    UpdateEditStatusRequest,
    UpdateEditStatusResponse,
    UpdateJobStatusRequest,
    UpdateJobStatusResponse,
    UpdateNotesRequest,
    UpdateNotesResponse,
} from '../pages/jobApplication/models';
import type {
    CreateInterviewRequest,
    CreateInterviewResponse,
    DeleteAllInterviewsRequest,
    DeleteAllInterviewsResponse,
    DeleteInterviewRequest,
    DeleteInterviewResponse,
    ListInterviewsRequest,
    ListInterviewsResponse,
} from '../pages/interview/models';
import type {
    GetUserPreferencesRequest,
    GetUserPreferencesResponse,
    UpdateUserPreferencesRequest,
    UpdateUserPreferencesResponse,
} from '../components/userPreferences/models';
import type {
    LogoutRequest,
    LogoutResponse,
    SignInRequest,
    SignInResponse,
    SignUpRequest,
    SignUpResponse,
    VerifyAuthenticationRequest,
    VerifyAuthenticationResponse,
} from '../pages/authentication/models';
import { endpointConfig } from './endpointConfig';
import { makeAuthenticatedJobTrackerAPIRequest, makeJobTrackerAPIRequest } from './api';
import { useMemo } from 'react';

export const useJobTrackerAPI = () => {
    const jobTrackerAPI = useMemo(() => {
        const signIn = async (req: SignInRequest) => {
            return await makeJobTrackerAPIRequest<SignInRequest, SignInResponse>(
                req,
                endpointConfig.authentication.signIn,
                'include'
            );
        };

        const signUp = async (req: SignUpRequest) => {
            return await makeJobTrackerAPIRequest<SignUpRequest, SignUpResponse>(
                req,
                endpointConfig.authentication.signUp
            );
        };

        const verify = async () => {
            return await makeAuthenticatedJobTrackerAPIRequest<
                VerifyAuthenticationRequest,
                VerifyAuthenticationResponse
            >(null, endpointConfig.authentication.verify);
        };

        const logout = async () => {
            return await makeJobTrackerAPIRequest<LogoutRequest, LogoutResponse>(
                null,
                endpointConfig.authentication.logout,
                'include'
            );
        };

        const listApplications = async (req: ListApplicationsRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<ListApplicationsRequest, ListApplicationsResponse>(
                req,
                endpointConfig.application.listApplications
            );
        };

        const listWeeklyApplications = async () => {
            return await makeAuthenticatedJobTrackerAPIRequest<
                ListWeeklyApplicationsRequest,
                ListWeeklyApplicationsResponse
            >(null, endpointConfig.application.listWeeklyApplications);
        };

        const listJobStatusCounts = async () => {
            return await makeAuthenticatedJobTrackerAPIRequest<ListJobStatusCountsRequest, ListJobStatusCountsResponse>(
                null,
                endpointConfig.application.listJobStatusCounts
            );
        };

        const createApplication = async (req: CreateApplicationRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<CreateApplicationRequest, CreateApplicationResponse>(
                req,
                endpointConfig.application.createApplication
            );
        };

        const deleteApplication = async (req: DeleteApplicationRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<DeleteApplicationRequest, DeleteApplicationResponse>(
                req,
                endpointConfig.application.deleteApplication
            );
        };

        const deleteAllApplications = async () => {
            return await makeAuthenticatedJobTrackerAPIRequest<
                DeleteAllApplicationsRequest,
                DeleteAllApplicationsResponse
            >(null, endpointConfig.application.deleteAllApplications);
        };

        const updateNotes = async (req: UpdateNotesRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<UpdateNotesRequest, UpdateNotesResponse>(
                req,
                endpointConfig.application.updateNotes
            );
        };

        const updateEditStatus = async (req: UpdateEditStatusRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<UpdateEditStatusRequest, UpdateEditStatusResponse>(
                req,
                endpointConfig.application.updateEditStatus
            );
        };

        const updateJobStatus = async (req: UpdateJobStatusRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<UpdateJobStatusRequest, UpdateJobStatusResponse>(
                req,
                endpointConfig.application.updateJobStatus
            );
        };

        const listInterviews = async () => {
            return await makeAuthenticatedJobTrackerAPIRequest<ListInterviewsRequest, ListInterviewsResponse>(
                null,
                endpointConfig.interview.listInterviews
            );
        };

        const createInterview = async (req: CreateInterviewRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<CreateInterviewRequest, CreateInterviewResponse>(
                req,
                endpointConfig.interview.createInterview
            );
        };

        const deleteInterview = async (req: DeleteInterviewRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<DeleteInterviewRequest, DeleteInterviewResponse>(
                req,
                endpointConfig.interview.deleteInterview
            );
        };

        const deleteAllInterviews = async () => {
            return await makeAuthenticatedJobTrackerAPIRequest<DeleteAllInterviewsRequest, DeleteAllInterviewsResponse>(
                null,
                endpointConfig.interview.deleteAllInterviews
            );
        };

        const listArchivedApplications = async (req: ListArchivedApplicationsRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<
                ListArchivedApplicationsRequest,
                ListArchivedApplicationsResponse
            >(req, endpointConfig.archivedApplication.listApplications);
        };

        const archiveApplication = async (req: ArchiveApplicationRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<ArchiveApplicationRequest, ArchiveApplicationResponse>(
                req,
                endpointConfig.archivedApplication.archiveApplication
            );
        };

        const deleteArchivedApplication = async (req: DeleteArchivedApplicationRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<
                DeleteArchivedApplicationRequest,
                DeleteArchivedApplicationResponse
            >(req, endpointConfig.archivedApplication.deleteApplication);
        };

        const deleteAllArchivedApplications = async () => {
            return await makeAuthenticatedJobTrackerAPIRequest<
                DeleteAllArchivedApplicationsRequest,
                DeleteAllArchivedApplicationsResponse
            >(null, endpointConfig.archivedApplication.deleteAllApplications);
        };

        const unarchiveApplication = async (req: UnarchiveApplicationRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<
                UnarchiveApplicationRequest,
                UnarchiveApplicationResponse
            >(req, endpointConfig.archivedApplication.unarchiveApplication);
        };

        const listArchivedInterviews = async () => {
            return await makeAuthenticatedJobTrackerAPIRequest<
                ListArchivedInterviewsRequest,
                ListArchivedInterviewsResponse
            >(null, endpointConfig.archivedInterview.listInterviews);
        };

        const deleteArchivedInterview = async (req: DeleteArchivedInterviewRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<
                DeleteArchivedInterviewRequest,
                DeleteArchivedInterviewResponse
            >(req, endpointConfig.archivedInterview.deleteInterview);
        };

        const deleteAllArchivedInterviews = async () => {
            return await makeAuthenticatedJobTrackerAPIRequest<
                DeleteAllArchivedInterviewsRequest,
                DeleteAllArchivedInterviewsResponse
            >(null, endpointConfig.archivedInterview.deleteAllInterviews);
        };

        const getUserPreferences = async () => {
            return await makeAuthenticatedJobTrackerAPIRequest<GetUserPreferencesRequest, GetUserPreferencesResponse>(
                null,
                endpointConfig.userPreferences.get
            );
        };

        const updateUserPreferences = async (req: UpdateUserPreferencesRequest) => {
            return await makeAuthenticatedJobTrackerAPIRequest<
                UpdateUserPreferencesRequest,
                UpdateUserPreferencesResponse
            >(req, endpointConfig.userPreferences.update);
        };

        return {
            authentication: { signIn, signUp, verify, logout },
            application: {
                listApplications,
                listWeeklyApplications,
                listJobStatusCounts,
                createApplication,
                deleteApplication,
                deleteAllApplications,
                updateNotes,
                updateEditStatus,
                updateJobStatus,
            },
            interview: {
                listInterviews,
                createInterview,
                deleteInterview,
                deleteAllInterviews,
            },
            archivedApplication: {
                listApplications: listArchivedApplications,
                archiveApplication,
                deleteApplication: deleteArchivedApplication,
                deleteAllApplications: deleteAllArchivedApplications,
                unarchiveApplication,
            },
            archivedInterview: {
                listInterviews: listArchivedInterviews,
                deleteInterview: deleteArchivedInterview,
                deleteAllInterviews: deleteAllArchivedInterviews,
            },
            userPreferences: {
                get: getUserPreferences,
                update: updateUserPreferences,
            },
        };
    }, []);

    return jobTrackerAPI;
};
