import type { ApplicationBoardSortOrder, ApplicationListSortOrder, JobStatus } from '../../pages/application/models';
import type { ApplicationViewMode } from '../activityControls/applicationViewToggle/models';
import type { InterviewTimeFilter } from '../../helper/interviewTiming';

export type UserPreferences = {
    application_job_statuses: JobStatus[];
    application_show_notes: boolean;
    application_show_archive: boolean;
    application_enable_scroll: boolean;
    application_view_mode: ApplicationViewMode;
    application_list_sort_order: ApplicationListSortOrder;
    application_board_sort_order: ApplicationBoardSortOrder;
    archived_application_job_statuses: JobStatus[];
    archived_application_show_notes: boolean;
    archived_application_view_mode: ApplicationViewMode;
    archived_application_list_sort_order: ApplicationListSortOrder;
    archived_application_board_sort_order: ApplicationBoardSortOrder;
    interview_view_mode: ApplicationViewMode;
    archived_interview_view_mode: ApplicationViewMode;
    interview_time_filters: InterviewTimeFilter[];
    archived_interview_time_filters: InterviewTimeFilter[];
};

export type GetUserPreferencesRequest = null;
export type GetUserPreferencesResponse = UserPreferences;

export type UpdateUserPreferencesRequest = {
    application_job_statuses?: JobStatus[];
    application_show_notes?: boolean;
    application_show_archive?: boolean;
    application_enable_scroll?: boolean;
    application_view_mode?: ApplicationViewMode;
    application_list_sort_order?: ApplicationListSortOrder;
    application_board_sort_order?: ApplicationBoardSortOrder;
    archived_application_job_statuses?: JobStatus[];
    archived_application_show_notes?: boolean;
    archived_application_view_mode?: ApplicationViewMode;
    archived_application_list_sort_order?: ApplicationListSortOrder;
    archived_application_board_sort_order?: ApplicationBoardSortOrder;
    interview_view_mode?: ApplicationViewMode;
    archived_interview_view_mode?: ApplicationViewMode;
    interview_time_filters?: InterviewTimeFilter[];
    archived_interview_time_filters?: InterviewTimeFilter[];
};
export type UpdateUserPreferencesResponse = UserPreferences;

export type UserPreferencesContextValue = {
    preferences: UserPreferences;
    updatePreferences: (preferences: UpdateUserPreferencesRequest) => Promise<UserPreferences>;
};
