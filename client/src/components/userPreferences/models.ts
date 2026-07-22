import type { ApplicationBoardSortOrder, ApplicationListSortOrder, JobStatus } from '../../pages/application/models';
import type { CollectionViewMode } from '../activityControls/collectionViewToggle/models';
import type { InterviewTimeFilter } from '../../helper/interviewTiming';
import type { ArchivedOfferDecisionFilter, OfferDecisionFilter } from '../../pages/offerDecision/models';

export type UserPreferences = {
    application_job_statuses: JobStatus[];
    application_show_notes: boolean;
    application_show_archive: boolean;
    application_enable_scroll: boolean;
    application_view_mode: CollectionViewMode;
    application_list_sort_order: ApplicationListSortOrder;
    application_board_sort_order: ApplicationBoardSortOrder;
    archived_application_job_statuses: JobStatus[];
    archived_application_show_notes: boolean;
    archived_application_view_mode: CollectionViewMode;
    archived_application_list_sort_order: ApplicationListSortOrder;
    archived_application_board_sort_order: ApplicationBoardSortOrder;
    interview_view_mode: CollectionViewMode;
    archived_interview_view_mode: CollectionViewMode;
    interview_time_filters: InterviewTimeFilter[];
    archived_interview_time_filters: InterviewTimeFilter[];
    offer_decision_filters: OfferDecisionFilter[];
    archived_offer_decision_filters: ArchivedOfferDecisionFilter[];
};

export type GetUserPreferencesRequest = null;
export type GetUserPreferencesResponse = UserPreferences;

export type UpdateUserPreferencesRequest = Partial<UserPreferences>;
export type UpdateUserPreferencesResponse = UserPreferences;

export type UserPreferencesContextValue = {
    preferences: UserPreferences;
    updatePreferences: (preferences: UpdateUserPreferencesRequest) => Promise<UserPreferences>;
};
