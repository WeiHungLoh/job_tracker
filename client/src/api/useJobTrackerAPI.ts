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
import type { WakeRequest, WakeResponse } from './models';
import { endpointConfig } from './endpointConfig';
import { makeJobTrackerAPIRequest } from './api';
import { useMemo } from 'react';

export const useJobTrackerAPI = () => {
    const jobTrackerAPI = useMemo(() => {
        const wake = async () => {
            return await makeJobTrackerAPIRequest<WakeRequest, WakeResponse>(null, endpointConfig.ping.wake);
        };

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
            return await makeJobTrackerAPIRequest<VerifyAuthenticationRequest, VerifyAuthenticationResponse>(
                null,
                endpointConfig.authentication.verify,
                'include'
            );
        };

        const logout = async () => {
            return await makeJobTrackerAPIRequest<LogoutRequest, LogoutResponse>(
                null,
                endpointConfig.authentication.logout,
                'include'
            );
        };

        const listApplications = async (req: ListApplicationsRequest) => {
            return await makeJobTrackerAPIRequest<ListApplicationsRequest, ListApplicationsResponse>(
                req,
                endpointConfig.application.listApplications,
                'include'
            );
        };

        const listWeeklyApplications = async () => {
            return await makeJobTrackerAPIRequest<ListWeeklyApplicationsRequest, ListWeeklyApplicationsResponse>(
                null,
                endpointConfig.application.listWeeklyApplications,
                'include'
            );
        };

        const listJobStatusCounts = async () => {
            return await makeJobTrackerAPIRequest<ListJobStatusCountsRequest, ListJobStatusCountsResponse>(
                null,
                endpointConfig.application.listJobStatusCounts,
                'include'
            );
        };

        const createApplication = async (req: CreateApplicationRequest) => {
            return await makeJobTrackerAPIRequest<CreateApplicationRequest, CreateApplicationResponse>(
                req,
                endpointConfig.application.createApplication,
                'include'
            );
        };

        const deleteApplication = async (req: DeleteApplicationRequest) => {
            return await makeJobTrackerAPIRequest<DeleteApplicationRequest, DeleteApplicationResponse>(
                req,
                endpointConfig.application.deleteApplication,
                'include'
            );
        };

        const deleteAllApplications = async () => {
            return await makeJobTrackerAPIRequest<DeleteAllApplicationsRequest, DeleteAllApplicationsResponse>(
                null,
                endpointConfig.application.deleteAllApplications,
                'include'
            );
        };

        const updateNotes = async (req: UpdateNotesRequest) => {
            return await makeJobTrackerAPIRequest<UpdateNotesRequest, UpdateNotesResponse>(
                req,
                endpointConfig.application.updateNotes,
                'include'
            );
        };

        const updateEditStatus = async (req: UpdateEditStatusRequest) => {
            return await makeJobTrackerAPIRequest<UpdateEditStatusRequest, UpdateEditStatusResponse>(
                req,
                endpointConfig.application.updateEditStatus,
                'include'
            );
        };

        const updateJobStatus = async (req: UpdateJobStatusRequest) => {
            return await makeJobTrackerAPIRequest<UpdateJobStatusRequest, UpdateJobStatusResponse>(
                req,
                endpointConfig.application.updateJobStatus,
                'include'
            );
        };

        const listInterviews = async () => {
            return await makeJobTrackerAPIRequest<ListInterviewsRequest, ListInterviewsResponse>(
                null,
                endpointConfig.interview.listInterviews,
                'include'
            );
        };

        const createInterview = async (req: CreateInterviewRequest) => {
            return await makeJobTrackerAPIRequest<CreateInterviewRequest, CreateInterviewResponse>(
                req,
                endpointConfig.interview.createInterview,
                'include'
            );
        };

        const deleteInterview = async (req: DeleteInterviewRequest) => {
            return await makeJobTrackerAPIRequest<DeleteInterviewRequest, DeleteInterviewResponse>(
                req,
                endpointConfig.interview.deleteInterview,
                'include'
            );
        };

        const deleteAllInterviews = async () => {
            return await makeJobTrackerAPIRequest<DeleteAllInterviewsRequest, DeleteAllInterviewsResponse>(
                null,
                endpointConfig.interview.deleteAllInterviews,
                'include'
            );
        };

        const listArchivedApplications = async (req: ListArchivedApplicationsRequest) => {
            return await makeJobTrackerAPIRequest<ListArchivedApplicationsRequest, ListArchivedApplicationsResponse>(
                req,
                endpointConfig.archivedApplication.listApplications,
                'include'
            );
        };

        const archiveApplication = async (req: ArchiveApplicationRequest) => {
            return await makeJobTrackerAPIRequest<ArchiveApplicationRequest, ArchiveApplicationResponse>(
                req,
                endpointConfig.archivedApplication.archiveApplication,
                'include'
            );
        };

        const deleteArchivedApplication = async (req: DeleteArchivedApplicationRequest) => {
            return await makeJobTrackerAPIRequest<DeleteArchivedApplicationRequest, DeleteArchivedApplicationResponse>(
                req,
                endpointConfig.archivedApplication.deleteApplication,
                'include'
            );
        };

        const deleteAllArchivedApplications = async () => {
            return await makeJobTrackerAPIRequest<
                DeleteAllArchivedApplicationsRequest,
                DeleteAllArchivedApplicationsResponse
            >(null, endpointConfig.archivedApplication.deleteAllApplications, 'include');
        };

        const unarchiveApplication = async (req: UnarchiveApplicationRequest) => {
            return await makeJobTrackerAPIRequest<UnarchiveApplicationRequest, UnarchiveApplicationResponse>(
                req,
                endpointConfig.archivedApplication.unarchiveApplication,
                'include'
            );
        };

        const listArchivedInterviews = async () => {
            return await makeJobTrackerAPIRequest<ListArchivedInterviewsRequest, ListArchivedInterviewsResponse>(
                null,
                endpointConfig.archivedInterview.listInterviews,
                'include'
            );
        };

        const deleteArchivedInterview = async (req: DeleteArchivedInterviewRequest) => {
            return await makeJobTrackerAPIRequest<DeleteArchivedInterviewRequest, DeleteArchivedInterviewResponse>(
                req,
                endpointConfig.archivedInterview.deleteInterview,
                'include'
            );
        };

        const deleteAllArchivedInterviews = async () => {
            return await makeJobTrackerAPIRequest<
                DeleteAllArchivedInterviewsRequest,
                DeleteAllArchivedInterviewsResponse
            >(null, endpointConfig.archivedInterview.deleteAllInterviews, 'include');
        };

        const getUserPreferences = async () => {
            return await makeJobTrackerAPIRequest<GetUserPreferencesRequest, GetUserPreferencesResponse>(
                null,
                endpointConfig.userPreferences.get,
                'include'
            );
        };

        const updateUserPreferences = async (req: UpdateUserPreferencesRequest) => {
            return await makeJobTrackerAPIRequest<UpdateUserPreferencesRequest, UpdateUserPreferencesResponse>(
                req,
                endpointConfig.userPreferences.update,
                'include'
            );
        };

        return {
            ping: { wake },
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
