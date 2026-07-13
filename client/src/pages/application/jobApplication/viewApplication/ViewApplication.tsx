import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createApplicationCsvData } from '../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../helper/deleteConfirmation';
import {
    createArchiveAllConfirmation,
    createDeleteAllApplicationsConfirmation,
} from '../../../../helper/bulkConfirmation';
import type { JobInterview } from '../../../interview/models';
import SkeletonCard from '../../../../components/skeletonLoader/skeletonCard/SkeletonCard';
import {
    APPLICATION_CSV_HEADERS,
    APPLICATION_BOARD_SORT_OPTIONS,
    APPLICATION_LIST_SORT_OPTIONS,
    JOB_STATUSES,
    type ApplicationBoardSortOrder,
    type ApplicationListSortOrder,
    type JobApplication,
    type JobStatus,
} from '../../models';
import { scrollAndHighlight } from '../../../../helper/highlightElement';
import { getInterviewTiming } from '../../../../helper/interviewTiming';
import styles from './ViewApplication.module.css';
import ToggleButton from '../../../../components/toggleButton/ToggleButton';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../../api/useJobTrackerAPI';
import { useToast } from '../../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../../components/userPreferences/UserPreferencesProvider';
import { getErrorToastMessage } from '../../../../helper/getErrorToastMessage';
import { FIELD_MAX_LENGTHS } from '../../../../helper/formValidation';
import CheckboxFilter from '../../../../components/activityControls/checkboxFilter/CheckboxFilter';
import type { UpdateUserPreferencesRequest } from '../../../../components/userPreferences/models';
import usePendingIds from '../../../../hooks/usePendingIds';
import ApplicationCard from '../../ApplicationCard';
import ActivityControls from '../../../../components/activityControls/ActivityControls';
import DisplayOptions from '../../../../components/activityControls/displayOptions/DisplayOptions';
import MoreOptions from '../../../../components/activityControls/moreOptions/MoreOptions';
import ApplicationBoard from '../applicationBoard/ApplicationBoard';
import ApplicationViewToggle from '../../../../components/activityControls/applicationViewToggle/ApplicationViewToggle';
import type { ApplicationViewMode } from '../../../../components/activityControls/applicationViewToggle/models';
import SkeletonBoard from '../../../../components/skeletonLoader/skeletonBoard/SkeletonBoard';
import EmptyState from '../../../../components/emptyState/EmptyState';
import { routes } from '../../../../routes';
import { createApplicationEmptyState } from '../../applicationEmptyState';
import SortOptions from '../../../../components/activityControls/sortOptions/SortOptions';
import { sortApplications } from '../../applicationSorting';
import { getApplicationsInBoardOrder } from '../../applicationBoard/applicationBoardUtils';
import { getDashboardJobStatus } from '../../../../helper/dashboardNavigation';
import useCurrentTime from '../../../../hooks/useCurrentTime';

const ViewApplication = () => {
    const currentTime = useCurrentTime();
    const api = useJobTrackerAPI();
    const { preferences, updatePreferences } = useUserPreferences();
    const location = useLocation();
    const navigate = useNavigate();
    const dashboardJobStatusRef = useRef(getDashboardJobStatus(location.state));
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [editingApplicationId, setEditingApplicationId] = useState<number | null>(null);
    const [editedJobStatus, setEditedJobStatus] = useState<JobStatus | null>(null);
    const [interviews, setInterviews] = useState<JobInterview[]>([]);
    const confirm = useConfirm();
    const showNotesTimeout = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
    const statusHighlightTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const showCorrespondingAppTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const updatingStatusApplicationIdRef = useRef<Set<number>>(new Set());
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFilteringApplications, setIsFilteringApplications] = useState<boolean>(false);
    const [applicationTotal, setApplicationTotal] = useState(0);
    const [pendingBulkAction, setPendingBulkAction] = useState<'archive' | 'delete' | null>(null);
    const bulkActionPendingRef = useRef(false);
    const {
        pendingIds: deletingApplicationIds,
        startPending: startDeletingApplication,
        stopPending: stopDeletingApplication,
    } = usePendingIds();
    const {
        pendingIds: archivingApplicationIds,
        startPending: startArchivingApplication,
        stopPending: stopArchivingApplication,
    } = usePendingIds();
    const {
        pendingIds: updatingStatusApplicationIds,
        startPending: startUpdatingApplicationStatus,
        stopPending: stopUpdatingApplicationStatus,
    } = usePendingIds();
    const { showErrorToast } = useToast();
    const selectedJobStatuses = preferences.application_job_statuses;
    const showArchive = preferences.application_show_archive;
    const showNotes = preferences.application_show_notes;
    const enableScroll = preferences.application_enable_scroll;
    const viewMode = preferences.application_view_mode;
    const isBoardView = viewMode === 'board';
    const currentSortOrder = isBoardView
        ? preferences.application_board_sort_order
        : preferences.application_list_sort_order;
    const displayedApplications = useMemo(
        () => sortApplications(applications, currentSortOrder),
        [applications, currentSortOrder]
    );
    const csvApplications = useMemo(
        () =>
            isBoardView
                ? getApplicationsInBoardOrder(displayedApplications, selectedJobStatuses)
                : displayedApplications,
        [displayedApplications, isBoardView, selectedJobStatuses]
    );
    const csvData = useMemo(() => createApplicationCsvData(csvApplications), [csvApplications]);

    const interviewJobIdSet = useMemo(() => new Set(interviews.map((interview) => interview.job_id)), [interviews]);

    const upcomingInterviewCountByJob = useMemo(() => {
        const counts: Record<number, number> = {};
        interviews.forEach((interview) => {
            if (getInterviewTiming(interview, currentTime).hasNotEnded) {
                counts[interview.job_id] = (counts[interview.job_id] || 0) + 1;
            }
        });
        return counts;
    }, [currentTime, interviews]);

    const closeStatusEditor = () => {
        setEditingApplicationId(null);
        setEditedJobStatus(null);
    };

    const handleViewModeChange = (nextViewMode: ApplicationViewMode) => {
        if (nextViewMode === 'board') {
            closeStatusEditor();
        }
        void handlePreferenceUpdate({ application_view_mode: nextViewMode });
    };

    const handleListSortOrderChange = async (sortOrder: ApplicationListSortOrder): Promise<boolean> => {
        try {
            await updatePreferences({ application_list_sort_order: sortOrder });
            return true;
        } catch (error) {
            showErrorToast(
                getErrorToastMessage(error, 'Unable to save the application sorting preference. Please try again.')
            );
            return false;
        }
    };

    const handleBoardSortOrderChange = async (sortOrder: ApplicationBoardSortOrder): Promise<boolean> => {
        try {
            await updatePreferences({ application_board_sort_order: sortOrder });
            return true;
        } catch (error) {
            showErrorToast(
                getErrorToastMessage(error, 'Unable to save the application sorting preference. Please try again.')
            );
            return false;
        }
    };

    const handleJobStatusChange = async (jobStatuses: JobStatus[]) => {
        closeStatusEditor();
        setIsFilteringApplications(true);

        try {
            const jobApplications = await api.application.listApplications({ jobStatuses });
            await updatePreferences({ application_job_statuses: jobStatuses });

            setApplications(Array.isArray(jobApplications) ? jobApplications : []);
            return true;
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to filter job applications. Please try again.'));
            return false;
        } finally {
            setIsFilteringApplications(false);
        }
    };

    const handlePreferenceUpdate = async (updatedPreferences: UpdateUserPreferencesRequest): Promise<void> => {
        try {
            await updatePreferences(updatedPreferences);
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to save display preferences. Please try again.'));
        }
    };

    useEffect(() => {
        let isActive = true;

        const fetchData = async () => {
            const dashboardJobStatus = dashboardJobStatusRef.current;
            const initialJobStatuses = dashboardJobStatus ? [dashboardJobStatus] : selectedJobStatuses;

            try {
                const preferenceUpdate =
                    dashboardJobStatus &&
                    (selectedJobStatuses.length !== 1 || selectedJobStatuses[0] !== dashboardJobStatus)
                        ? updatePreferences({ application_job_statuses: initialJobStatuses }).catch(
                              (error: unknown) => {
                                  showErrorToast(
                                      getErrorToastMessage(
                                          error,
                                          'Unable to filter job applications. Please try again.'
                                      )
                                  );
                              }
                          )
                        : Promise.resolve();
                const [jobApplications, jobInterviews] = await Promise.all([
                    api.application.listApplications({ jobStatuses: initialJobStatuses }),
                    api.interview.listInterviews(),
                    preferenceUpdate,
                ]);

                if (isActive) {
                    setApplications(Array.isArray(jobApplications) ? jobApplications : []);
                    setInterviews(Array.isArray(jobInterviews) ? jobInterviews : []);
                }
            } catch (error) {
                showErrorToast(getErrorToastMessage(error, 'Unable to load job application data. Please try again.'));
            } finally {
                if (dashboardJobStatusRef.current) {
                    dashboardJobStatusRef.current = null;
                    navigate(location.pathname, { replace: true, state: null });
                }
            }

            try {
                const summary = await api.application.getSummary();
                if (isActive) {
                    setApplicationTotal(summary.application_count);
                }
            } catch (error) {
                showErrorToast(
                    getErrorToastMessage(error, 'Unable to load active application counts. Please try again.')
                );
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        void fetchData();
        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        const targetApplicationId = location.hash.substring(1);
        if (isLoading || isBoardView || !targetApplicationId) {
            return;
        }

        const targetApplicationIsVisible = applications.some(
            (application) => String(application.job_id) === targetApplicationId
        );
        if (!targetApplicationIsVisible) {
            return;
        }

        scrollAndHighlight(targetApplicationId, styles.highlighted, showCorrespondingAppTimeout.current);
        // to remove the hash
        navigate(location.pathname, { replace: true });
    }, [applications, isBoardView, isLoading, location.hash, location.pathname, navigate]);

    const handleEditNotes = (jobId: number, editedNotes: string) => {
        if (editedNotes.length > FIELD_MAX_LENGTHS.notes) {
            showErrorToast(`Notes must be ${FIELD_MAX_LENGTHS.notes} characters or fewer.`);
            return;
        }

        setNotes((currentNotes) => ({ ...currentNotes, [jobId]: editedNotes }));

        const taskId = showNotesTimeout.current[jobId];
        if (taskId) {
            clearTimeout(taskId);
        }

        showNotesTimeout.current[jobId] = setTimeout(async () => {
            try {
                await api.application.updateNotes({ jobId, notes: editedNotes });
                setApplications((current) =>
                    current.map((application) =>
                        application.job_id === jobId ? { ...application, notes: editedNotes } : application
                    )
                );
            } catch (error) {
                showErrorToast(getErrorToastMessage(error, 'Unable to save job application notes. Please try again.'));
            }
        }, 500);
    };

    const handleDelete = async (jobId: number) => {
        try {
            const { confirmed } = await confirm(createDeleteConfirmation('job application'));

            if (!confirmed) {
                return;
            }

            startDeletingApplication(jobId);
            try {
                await api.application.deleteApplication({ jobId });
                setApplications((current) => current.filter((application) => application.job_id !== jobId));
                setInterviews((current) => current.filter((interview) => interview.job_id !== jobId));
                setApplicationTotal((current) => Math.max(0, current - 1));
            } finally {
                stopDeletingApplication(jobId);
            }
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to delete the job application. Please try again.'));
        }
    };

    const handleBulkAction = async (action: 'archive' | 'delete') => {
        if (bulkActionPendingRef.current) {
            return;
        }

        bulkActionPendingRef.current = true;
        setPendingBulkAction(action);
        let countsLoaded = false;

        try {
            const summary = await api.application.getSummary();
            countsLoaded = true;
            setApplicationTotal(summary.application_count);

            if (summary.application_count === 0) {
                setApplications([]);
                setInterviews([]);
                return;
            }

            const confirmation =
                action === 'archive'
                    ? createArchiveAllConfirmation(summary.application_count, summary.related_interview_count)
                    : createDeleteAllApplicationsConfirmation(
                          summary.application_count,
                          summary.related_interview_count,
                          'active'
                      );
            const { confirmed } = await confirm(confirmation);

            if (!confirmed) {
                return;
            }

            if (action === 'archive') {
                await api.archivedApplication.archiveAllApplications();
            } else {
                await api.application.deleteAllApplications();
            }

            setApplications([]);
            setInterviews([]);
            setApplicationTotal(0);
        } catch (error) {
            const fallback = !countsLoaded
                ? 'Unable to load active application counts. Please try again.'
                : action === 'archive'
                ? 'Unable to archive job applications. Please try again.'
                : 'Unable to delete job applications. Please try again.';
            showErrorToast(getErrorToastMessage(error, fallback));
        } finally {
            bulkActionPendingRef.current = false;
            setPendingBulkAction(null);
        }
    };

    const handleStatusEditorToggle = async (application: JobApplication) => {
        const isEditing = editingApplicationId === application.job_id;

        if (!isEditing) {
            setEditingApplicationId(application.job_id);
            setEditedJobStatus(application.job_status);
            return;
        }

        const newStatus = editedJobStatus ?? application.job_status;
        const oldStatus = application.job_status;
        const statusChanged = newStatus !== oldStatus;
        const statusRemainsVisible = selectedJobStatuses.includes(newStatus);

        if (!statusChanged) {
            closeStatusEditor();
            return;
        }

        try {
            await api.application.updateStatus({
                jobId: application.job_id,
                jobStatus: newStatus,
            });

            closeStatusEditor();
            setApplications((current) =>
                current
                    .map((item) => (item.job_id === application.job_id ? { ...item, job_status: newStatus } : item))
                    .filter((item) => selectedJobStatuses.includes(item.job_status))
            );

            if (enableScroll && statusRemainsVisible) {
                setTimeout(() => {
                    scrollAndHighlight(String(application.job_id), styles.highlighted, statusHighlightTimeout.current);
                }, 100);
            }
        } catch (error) {
            showErrorToast(
                getErrorToastMessage(error, 'Unable to update the job application status. Please try again.')
            );
        }
    };

    const updateApplicationStatusFromBoard = async (application: JobApplication, newStatus: JobStatus) => {
        const oldStatus = application.job_status;

        if (newStatus === oldStatus || updatingStatusApplicationIdRef.current.has(application.job_id)) {
            return;
        }

        updatingStatusApplicationIdRef.current.add(application.job_id);
        startUpdatingApplicationStatus(application.job_id);
        setApplications((current) =>
            current
                .map((item) => (item.job_id === application.job_id ? { ...item, job_status: newStatus } : item))
                .filter((item) => selectedJobStatuses.includes(item.job_status))
        );

        try {
            await api.application.updateStatus({
                jobId: application.job_id,
                jobStatus: newStatus,
            });
        } catch (error) {
            setApplications((current) => {
                const applicationStillVisible = current.some((item) => item.job_id === application.job_id);
                const restoredApplications = applicationStillVisible
                    ? current.map((item) => (item.job_id === application.job_id ? application : item))
                    : [...current, application];

                return restoredApplications;
            });
            showErrorToast(
                getErrorToastMessage(error, 'Unable to update the job application status. Please try again.')
            );
        } finally {
            updatingStatusApplicationIdRef.current.delete(application.job_id);
            stopUpdatingApplicationStatus(application.job_id);
        }
    };

    const handleArchive = async (jobId: number) => {
        startArchivingApplication(jobId);
        try {
            await api.archivedApplication.archiveApplication({ jobId });
            setApplications((current) => current.filter((application) => application.job_id !== jobId));
            setInterviews((current) => current.filter((interview) => interview.job_id !== jobId));
            setApplicationTotal((current) => Math.max(0, current - 1));
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to archive the job application. Please try again.'));
        } finally {
            stopArchivingApplication(jobId);
        }
    };

    const hasApplications = applications.length > 0;
    const filtersAreActive = selectedJobStatuses.length !== JOB_STATUSES.length;
    const emptyState = createApplicationEmptyState({
        actionRoute: routes.addApplication,
        filtersAreActive,
        onClearFilters: () => void handleJobStatusChange([...JOB_STATUSES]),
        variant: 'active',
    });

    return (
        <div className={`${styles.applicationList} ${isBoardView ? styles.boardLayout : ''}`}>
            <div className={styles.controlsRow}>
                <ActivityControls
                    actions={
                        applicationTotal > 0 ? (
                            <MoreOptions
                                csvData={csvData}
                                csvFilename='job_applications.csv'
                                csvHeaders={APPLICATION_CSV_HEADERS}
                                deleteLabel='Delete all applications'
                                id='application-more-options'
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
                    ariaLabel='Application view and management controls'
                    mobileLayout={isBoardView || !hasApplications ? 'applicationCompact' : 'applicationWithDisplay'}
                >
                    <ApplicationViewToggle currentView={viewMode} onViewChange={handleViewModeChange} />
                    <CheckboxFilter
                        buttonLabel='Filter by'
                        disabled={isLoading}
                        id='application-job-status-filter'
                        onSelectionChange={handleJobStatusChange}
                        options={JOB_STATUSES}
                        selectedOptions={selectedJobStatuses}
                    />
                    {hasApplications &&
                        (isBoardView ? (
                            <SortOptions
                                disabled={isLoading}
                                id='application-board-sort-options'
                                onSelectionChange={handleBoardSortOrderChange}
                                options={APPLICATION_BOARD_SORT_OPTIONS}
                                selectedOption={preferences.application_board_sort_order}
                            />
                        ) : (
                            <SortOptions
                                disabled={isLoading}
                                id='application-list-sort-options'
                                onSelectionChange={handleListSortOrderChange}
                                options={APPLICATION_LIST_SORT_OPTIONS}
                                selectedOption={preferences.application_list_sort_order}
                            />
                        ))}
                    {hasApplications && !isBoardView && (
                        <DisplayOptions id='application-display-options'>
                            <ToggleButton
                                toggled={showNotes}
                                onToggle={() =>
                                    void handlePreferenceUpdate({
                                        application_show_notes: !showNotes,
                                    })
                                }
                                label='Show notes'
                            />
                            <ToggleButton
                                toggled={showArchive}
                                onToggle={() =>
                                    void handlePreferenceUpdate({
                                        application_show_archive: !showArchive,
                                    })
                                }
                                label='Show archive'
                            />
                            <ToggleButton
                                toggled={enableScroll}
                                onToggle={() =>
                                    void handlePreferenceUpdate({
                                        application_enable_scroll: !enableScroll,
                                    })
                                }
                                label='Auto scroll after job status change'
                            />
                        </DisplayOptions>
                    )}
                </ActivityControls>
            </div>

            {(isLoading || isFilteringApplications) && !isBoardView && (
                <>
                    <SkeletonCard variant='application' />
                    <SkeletonCard variant='application' />
                </>
            )}

            {(isLoading || isFilteringApplications) && isBoardView && <SkeletonBoard />}

            {!isLoading && !isFilteringApplications && (
                <>
                    {!hasApplications && <EmptyState {...emptyState} />}

                    {hasApplications && isBoardView && (
                        <ApplicationBoard
                            applications={displayedApplications}
                            deletingApplicationIds={deletingApplicationIds}
                            editedNotes={notes}
                            hasInterview={(jobId) => interviewJobIdSet.has(jobId)}
                            isArchivingApplication={(jobId) => archivingApplicationIds.has(jobId)}
                            isUpdatingApplicationStatus={(jobId) => updatingStatusApplicationIds.has(jobId)}
                            onArchive={handleArchive}
                            onDelete={handleDelete}
                            onEditNotes={handleEditNotes}
                            onStatusChange={updateApplicationStatusFromBoard}
                            selectedJobStatuses={selectedJobStatuses}
                            upcomingInterviewCountByJob={upcomingInterviewCountByJob}
                        />
                    )}

                    {!isBoardView &&
                        displayedApplications.map((application, index) => (
                            <ApplicationCard
                                application={application}
                                editedJobStatus={
                                    editingApplicationId === application.job_id && editedJobStatus
                                        ? editedJobStatus
                                        : application.job_status
                                }
                                hasInterview={interviewJobIdSet.has(application.job_id)}
                                index={index}
                                isArchiving={archivingApplicationIds.has(application.job_id)}
                                isDeleting={deletingApplicationIds.has(application.job_id)}
                                isEditingStatus={editingApplicationId === application.job_id}
                                key={application.job_id}
                                note={notes[application.job_id] ?? application.notes}
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
                </>
            )}
        </div>
    );
};

export default ViewApplication;
