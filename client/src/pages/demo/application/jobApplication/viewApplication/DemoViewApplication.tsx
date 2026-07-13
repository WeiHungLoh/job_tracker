import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createApplicationCsvData } from '../../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../../helper/deleteConfirmation';
import {
    createArchiveAllConfirmation,
    createDeleteAllApplicationsConfirmation,
} from '../../../../../helper/bulkConfirmation';
import {
    APPLICATION_BOARD_SORT_OPTIONS,
    APPLICATION_CSV_HEADERS,
    APPLICATION_LIST_SORT_OPTIONS,
    JOB_STATUSES,
    type ApplicationBoardSortOrder,
    type ApplicationListSortOrder,
    type JobApplication,
    type JobStatus,
} from '../../../../application/models';
import { scrollAndHighlight } from '../../../../../helper/highlightElement';
import ToggleButton from '../../../../../components/toggleButton/ToggleButton';
import { useConfirm } from 'material-ui-confirm';
import { useDemo } from '../../../context/DemoContext';
import { useToast } from '../../../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../../../components/userPreferences/UserPreferencesProvider';
import { FIELD_MAX_LENGTHS } from '../../../../../helper/formValidation';
import ActivityControls from '../../../../../components/activityControls/ActivityControls';
import CheckboxFilter from '../../../../../components/activityControls/checkboxFilter/CheckboxFilter';
import DisplayOptions from '../../../../../components/activityControls/displayOptions/DisplayOptions';
import MoreOptions from '../../../../../components/activityControls/moreOptions/MoreOptions';
import SortOptions from '../../../../../components/activityControls/sortOptions/SortOptions';
import DemoApplicationBoard from '../applicationBoard/DemoApplicationBoard';
import DemoApplicationCard from '../../DemoApplicationCard';
import ApplicationViewToggle from '../../../../../components/activityControls/applicationViewToggle/ApplicationViewToggle';
import type { ApplicationViewMode } from '../../../../../components/activityControls/applicationViewToggle/models';
import {
    selectApplications,
    selectInterviewJobIdSet,
    selectUpcomingInterviewCountByJob,
} from '../../../state/demoSelectors';
import styles from './DemoViewApplication.module.css';
import { useDemoHashHighlight } from '../../../hooks/useDemoHashHighlight';
import EmptyState from '../../../../../components/emptyState/EmptyState';
import { routes } from '../../../../../routes';
import { createApplicationEmptyState } from '../../../../application/applicationEmptyState';
import { getApplicationsInBoardOrder } from '../../../../application/applicationBoard/applicationBoardUtils';
import { getDashboardJobStatus } from '../../../../../helper/dashboardNavigation';

const DemoViewApplication = () => {
    const { dispatch, state } = useDemo();
    const { preferences, updatePreferences } = useUserPreferences();
    const location = useLocation();
    const navigate = useNavigate();
    const dashboardJobStatusRef = useRef(getDashboardJobStatus(location.state));
    const [editingApplicationId, setEditingApplicationId] = useState<number | null>(null);
    const [editedJobStatus, setEditedJobStatus] = useState<JobStatus | null>(null);
    const confirm = useConfirm();
    const statusHighlightTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const showCorrespondingAppTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const { showErrorToast } = useToast();
    const [pendingBulkAction, setPendingBulkAction] = useState<'archive' | 'delete' | null>(null);
    const bulkActionPendingRef = useRef(false);
    const applications = useMemo(() => selectApplications(state), [state]);
    const interviewJobIdSet = useMemo(() => selectInterviewJobIdSet(state), [state]);
    const upcomingInterviewCountByJob = useMemo(() => selectUpcomingInterviewCountByJob(state), [state]);
    const selectedJobStatuses = preferences.application_job_statuses;
    const showArchive = preferences.application_show_archive;
    const showNotes = preferences.application_show_notes;
    const enableScroll = preferences.application_enable_scroll;
    const viewMode = preferences.application_view_mode;
    const isBoardView = viewMode === 'board';
    const csvApplications = isBoardView ? getApplicationsInBoardOrder(applications, selectedJobStatuses) : applications;
    const csvData = createApplicationCsvData(csvApplications);
    const visibleApplicationIds = useMemo(
        () => applications.map((application) => String(application.job_id)),
        [applications]
    );

    useDemoHashHighlight({
        disabled: isBoardView,
        highlightClass: styles.highlighted,
        timeouts: showCorrespondingAppTimeout.current,
        visibleIds: visibleApplicationIds,
    });

    useEffect(() => {
        const dashboardJobStatus = dashboardJobStatusRef.current;
        if (!dashboardJobStatus) {
            return;
        }

        dashboardJobStatusRef.current = null;
        if (selectedJobStatuses.length !== 1 || selectedJobStatuses[0] !== dashboardJobStatus) {
            void updatePreferences({ application_job_statuses: [dashboardJobStatus] });
        }
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, navigate, selectedJobStatuses, updatePreferences]);

    const closeStatusEditor = () => {
        setEditingApplicationId(null);
        setEditedJobStatus(null);
    };

    const handleViewModeChange = (nextViewMode: ApplicationViewMode) => {
        if (nextViewMode === 'board') {
            closeStatusEditor();
        }
        void updatePreferences({ application_view_mode: nextViewMode });
    };

    const handleJobStatusChange = async (jobStatuses: JobStatus[]) => {
        closeStatusEditor();
        await updatePreferences({ application_job_statuses: jobStatuses });
        return true;
    };

    const handleListSortOrderChange = async (sortOrder: ApplicationListSortOrder) => {
        await updatePreferences({ application_list_sort_order: sortOrder });
        return true;
    };

    const handleBoardSortOrderChange = async (sortOrder: ApplicationBoardSortOrder) => {
        await updatePreferences({ application_board_sort_order: sortOrder });
        return true;
    };

    const handleEditNotes = (jobId: number, editedNotes: string) => {
        if (editedNotes.length > FIELD_MAX_LENGTHS.notes) {
            showErrorToast(`Notes must be ${FIELD_MAX_LENGTHS.notes} characters or fewer.`);
            return;
        }

        dispatch({ type: 'UPDATE_APPLICATION_NOTES', payload: { jobId, notes: editedNotes } });
    };

    const handleDelete = async (jobId: number) => {
        const { confirmed } = await confirm(createDeleteConfirmation('job application'));

        if (!confirmed) {
            return;
        }

        dispatch({ type: 'DELETE_APPLICATION', payload: { jobId } });
    };

    const handleBulkAction = async (action: 'archive' | 'delete') => {
        if (bulkActionPendingRef.current) {
            return;
        }

        bulkActionPendingRef.current = true;
        setPendingBulkAction(action);
        const applicationIds = new Set(state.applications.map((application) => application.job_id));
        const interviewCount = state.interviews.filter((interview) => applicationIds.has(interview.job_id)).length;

        try {
            if (state.applications.length === 0) {
                return;
            }

            const confirmation =
                action === 'archive'
                    ? createArchiveAllConfirmation(state.applications.length, interviewCount)
                    : createDeleteAllApplicationsConfirmation(state.applications.length, interviewCount, 'active');
            const { confirmed } = await confirm(confirmation);

            if (!confirmed) {
                return;
            }

            dispatch({ type: action === 'archive' ? 'ARCHIVE_ALL_APPLICATIONS' : 'DELETE_ALL_APPLICATIONS' });
        } finally {
            bulkActionPendingRef.current = false;
            setPendingBulkAction(null);
        }
    };

    const handleStatusEditorToggle = (application: JobApplication) => {
        const isEditing = editingApplicationId === application.job_id;

        if (!isEditing) {
            setEditingApplicationId(application.job_id);
            setEditedJobStatus(application.job_status);
            return;
        }

        const newStatus = editedJobStatus ?? application.job_status;
        const statusChanged = newStatus !== application.job_status;

        closeStatusEditor();
        if (!statusChanged) {
            return;
        }

        dispatch({
            type: 'UPDATE_APPLICATION_STATUS',
            payload: {
                jobId: application.job_id,
                jobStatus: newStatus,
            },
        });

        if (enableScroll) {
            setTimeout(() => {
                scrollAndHighlight(String(application.job_id), styles.highlighted, statusHighlightTimeout.current);
            }, 100);
        }
    };

    const updateApplicationStatusFromBoard = (application: JobApplication, newStatus: JobStatus) => {
        if (newStatus === application.job_status) {
            return;
        }

        dispatch({
            type: 'UPDATE_APPLICATION_STATUS',
            payload: { jobId: application.job_id, jobStatus: newStatus },
        });
    };

    const handleArchive = async (jobId: number) => {
        dispatch({ type: 'ARCHIVE_APPLICATION', payload: { jobId } });
    };

    const hasApplications = applications.length > 0;
    const filtersAreActive = selectedJobStatuses.length !== JOB_STATUSES.length;
    const emptyState = createApplicationEmptyState({
        actionRoute: routes.demoAddApplication,
        filtersAreActive,
        onClearFilters: () => void handleJobStatusChange([...JOB_STATUSES]),
        variant: 'active',
    });

    return (
        <div className={`${styles.applicationList} ${isBoardView ? styles.boardLayout : ''}`}>
            <div className={styles.controlsRow}>
                <ActivityControls
                    actions={
                        state.applications.length > 0 ? (
                            <MoreOptions
                                csvData={csvData}
                                csvFilename='demo_job_applications.csv'
                                csvHeaders={APPLICATION_CSV_HEADERS}
                                deleteLabel='Delete all applications'
                                id='demo-application-more-options'
                                deleteDisabled={pendingBulkAction === 'archive'}
                                isDeleting={pendingBulkAction === 'delete'}
                                middleAction={{
                                    disabled: pendingBulkAction === 'delete',
                                    icon: 'archive',
                                    isLoading: pendingBulkAction === 'archive',
                                    label: 'Archive all applications',
                                    onClick: () => void handleBulkAction('archive'),
                                }}
                                onDelete={() => void handleBulkAction('delete')}
                            />
                        ) : undefined
                    }
                    ariaLabel='Demo application view and management controls'
                    mobileLayout={isBoardView || !hasApplications ? 'applicationCompact' : 'applicationWithDisplay'}
                >
                    <ApplicationViewToggle currentView={viewMode} onViewChange={handleViewModeChange} />
                    <CheckboxFilter
                        buttonLabel='Filter by'
                        id='demo-application-job-status-filter'
                        onSelectionChange={handleJobStatusChange}
                        options={JOB_STATUSES}
                        selectedOptions={selectedJobStatuses}
                    />
                    {hasApplications &&
                        (isBoardView ? (
                            <SortOptions
                                id='demo-application-board-sort-options'
                                onSelectionChange={handleBoardSortOrderChange}
                                options={APPLICATION_BOARD_SORT_OPTIONS}
                                selectedOption={preferences.application_board_sort_order}
                            />
                        ) : (
                            <SortOptions
                                id='demo-application-list-sort-options'
                                onSelectionChange={handleListSortOrderChange}
                                options={APPLICATION_LIST_SORT_OPTIONS}
                                selectedOption={preferences.application_list_sort_order}
                            />
                        ))}
                    {hasApplications && !isBoardView && (
                        <DisplayOptions id='demo-application-display-options'>
                            <ToggleButton
                                toggled={showNotes}
                                onToggle={() =>
                                    void updatePreferences({
                                        application_show_notes: !showNotes,
                                    })
                                }
                                label='Show notes'
                            />
                            <ToggleButton
                                toggled={showArchive}
                                onToggle={() =>
                                    void updatePreferences({
                                        application_show_archive: !showArchive,
                                    })
                                }
                                label='Show archive'
                            />
                            <ToggleButton
                                toggled={enableScroll}
                                onToggle={() =>
                                    void updatePreferences({
                                        application_enable_scroll: !enableScroll,
                                    })
                                }
                                label='Auto scroll after job status change'
                            />
                        </DisplayOptions>
                    )}
                </ActivityControls>
            </div>

            {!hasApplications && <EmptyState {...emptyState} />}

            {hasApplications && isBoardView && (
                <DemoApplicationBoard
                    applications={applications}
                    deletingApplicationIds={new Set<number>()}
                    editedNotes={{}}
                    hasInterview={(jobId) => interviewJobIdSet.has(jobId)}
                    isArchivingApplication={() => false}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    onEditNotes={handleEditNotes}
                    onStatusChange={updateApplicationStatusFromBoard}
                    selectedJobStatuses={selectedJobStatuses}
                    upcomingInterviewCountByJob={upcomingInterviewCountByJob}
                />
            )}

            {!isBoardView &&
                applications.map((application, index) => (
                    <DemoApplicationCard
                        application={application}
                        editedJobStatus={
                            editingApplicationId === application.job_id && editedJobStatus
                                ? editedJobStatus
                                : application.job_status
                        }
                        hasInterview={interviewJobIdSet.has(application.job_id)}
                        index={index}
                        isArchiving={false}
                        isDeleting={false}
                        isEditingStatus={editingApplicationId === application.job_id}
                        key={application.job_id}
                        note={application.notes}
                        onArchive={handleArchive}
                        onDelete={handleDelete}
                        onEditNotes={handleEditNotes}
                        onJobStatusChange={setEditedJobStatus}
                        onToggleStatusEditor={handleStatusEditorToggle}
                        showArchive={showArchive}
                        showNotes={showNotes}
                        upcomingInterviewCount={upcomingInterviewCountByJob[application.job_id] ?? 0}
                        variant='job'
                    />
                ))}
        </div>
    );
};

export default DemoViewApplication;
