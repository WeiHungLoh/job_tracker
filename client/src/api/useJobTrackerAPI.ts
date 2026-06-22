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
        const ping = {
            async wake() {
                return await makeJobTrackerAPIRequest<WakeRequest, WakeResponse>(null, endpointConfig.ping.wake);
            },
        };

        const authentication = {
            async signIn(req: SignInRequest) {
                return await makeJobTrackerAPIRequest<SignInRequest, SignInResponse>(
                    req,
                    endpointConfig.authentication.signIn,
                    'include'
                );
            },

            async signUp(req: SignUpRequest) {
                return await makeJobTrackerAPIRequest<SignUpRequest, SignUpResponse>(
                    req,
                    endpointConfig.authentication.signUp
                );
            },

            async verify() {
                return await makeJobTrackerAPIRequest<VerifyAuthenticationRequest, VerifyAuthenticationResponse>(
                    null,
                    endpointConfig.authentication.verify,
                    'include'
                );
            },

            async logout() {
                return await makeJobTrackerAPIRequest<LogoutRequest, LogoutResponse>(
                    null,
                    endpointConfig.authentication.logout,
                    'include'
                );
            },
        };

        const application = {
            async listApplications(req: ListApplicationsRequest) {
                return await makeJobTrackerAPIRequest<ListApplicationsRequest, ListApplicationsResponse>(
                    req,
                    endpointConfig.application.listApplications,
                    'include'
                );
            },

            async listWeeklyApplications() {
                return await makeJobTrackerAPIRequest<ListWeeklyApplicationsRequest, ListWeeklyApplicationsResponse>(
                    null,
                    endpointConfig.application.listWeeklyApplications,
                    'include'
                );
            },

            async listJobStatusCounts() {
                return await makeJobTrackerAPIRequest<ListJobStatusCountsRequest, ListJobStatusCountsResponse>(
                    null,
                    endpointConfig.application.listJobStatusCounts,
                    'include'
                );
            },

            async createApplication(req: CreateApplicationRequest) {
                return await makeJobTrackerAPIRequest<CreateApplicationRequest, CreateApplicationResponse>(
                    req,
                    endpointConfig.application.createApplication,
                    'include'
                );
            },

            async deleteApplication(req: DeleteApplicationRequest) {
                return await makeJobTrackerAPIRequest<DeleteApplicationRequest, DeleteApplicationResponse>(
                    req,
                    endpointConfig.application.deleteApplication,
                    'include'
                );
            },

            async deleteAllApplications() {
                return await makeJobTrackerAPIRequest<DeleteAllApplicationsRequest, DeleteAllApplicationsResponse>(
                    null,
                    endpointConfig.application.deleteAllApplications,
                    'include'
                );
            },

            async updateNotes(req: UpdateNotesRequest) {
                return await makeJobTrackerAPIRequest<UpdateNotesRequest, UpdateNotesResponse>(
                    req,
                    endpointConfig.application.updateNotes,
                    'include'
                );
            },

            async updateEditStatus(req: UpdateEditStatusRequest) {
                return await makeJobTrackerAPIRequest<UpdateEditStatusRequest, UpdateEditStatusResponse>(
                    req,
                    endpointConfig.application.updateEditStatus,
                    'include'
                );
            },

            async updateJobStatus(req: UpdateJobStatusRequest) {
                return await makeJobTrackerAPIRequest<UpdateJobStatusRequest, UpdateJobStatusResponse>(
                    req,
                    endpointConfig.application.updateJobStatus,
                    'include'
                );
            },
        };

        const interview = {
            async listInterviews() {
                return await makeJobTrackerAPIRequest<ListInterviewsRequest, ListInterviewsResponse>(
                    null,
                    endpointConfig.interview.listInterviews,
                    'include'
                );
            },

            async createInterview(req: CreateInterviewRequest) {
                return await makeJobTrackerAPIRequest<CreateInterviewRequest, CreateInterviewResponse>(
                    req,
                    endpointConfig.interview.createInterview,
                    'include'
                );
            },

            async deleteInterview(req: DeleteInterviewRequest) {
                return await makeJobTrackerAPIRequest<DeleteInterviewRequest, DeleteInterviewResponse>(
                    req,
                    endpointConfig.interview.deleteInterview,
                    'include'
                );
            },

            async deleteAllInterviews() {
                return await makeJobTrackerAPIRequest<DeleteAllInterviewsRequest, DeleteAllInterviewsResponse>(
                    null,
                    endpointConfig.interview.deleteAllInterviews,
                    'include'
                );
            },
        };

        const archivedApplication = {
            async listApplications(req: ListArchivedApplicationsRequest) {
                return await makeJobTrackerAPIRequest<
                    ListArchivedApplicationsRequest,
                    ListArchivedApplicationsResponse
                >(req, endpointConfig.archivedApplication.listApplications, 'include');
            },

            async archiveApplication(req: ArchiveApplicationRequest) {
                return await makeJobTrackerAPIRequest<ArchiveApplicationRequest, ArchiveApplicationResponse>(
                    req,
                    endpointConfig.archivedApplication.archiveApplication,
                    'include'
                );
            },

            async deleteApplication(req: DeleteArchivedApplicationRequest) {
                return await makeJobTrackerAPIRequest<
                    DeleteArchivedApplicationRequest,
                    DeleteArchivedApplicationResponse
                >(req, endpointConfig.archivedApplication.deleteApplication, 'include');
            },

            async deleteAllApplications() {
                return await makeJobTrackerAPIRequest<
                    DeleteAllArchivedApplicationsRequest,
                    DeleteAllArchivedApplicationsResponse
                >(null, endpointConfig.archivedApplication.deleteAllApplications, 'include');
            },

            async unarchiveApplication(req: UnarchiveApplicationRequest) {
                return await makeJobTrackerAPIRequest<UnarchiveApplicationRequest, UnarchiveApplicationResponse>(
                    req,
                    endpointConfig.archivedApplication.unarchiveApplication,
                    'include'
                );
            },
        };

        const archivedInterview = {
            async listInterviews() {
                return await makeJobTrackerAPIRequest<ListArchivedInterviewsRequest, ListArchivedInterviewsResponse>(
                    null,
                    endpointConfig.archivedInterview.listInterviews,
                    'include'
                );
            },

            async deleteInterview(req: DeleteArchivedInterviewRequest) {
                return await makeJobTrackerAPIRequest<DeleteArchivedInterviewRequest, DeleteArchivedInterviewResponse>(
                    req,
                    endpointConfig.archivedInterview.deleteInterview,
                    'include'
                );
            },

            async deleteAllInterviews() {
                return await makeJobTrackerAPIRequest<
                    DeleteAllArchivedInterviewsRequest,
                    DeleteAllArchivedInterviewsResponse
                >(null, endpointConfig.archivedInterview.deleteAllInterviews, 'include');
            },
        };

        return {
            ping,
            authentication,
            application,
            interview,
            archivedApplication,
            archivedInterview,
        };
    }, []);

    return jobTrackerAPI;
};
