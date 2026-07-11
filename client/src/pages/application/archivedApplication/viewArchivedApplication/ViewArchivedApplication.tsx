import { useEffect, useRef, useState } from 'react';
import type { ArchivedJobApplication } from '../../models';
import { createApplicationCsvData } from '../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../helper/deleteConfirmation';
import {
    createDeleteAllApplicationsConfirmation,
    createUnarchiveAllConfirmation,
} from '../../../../helper/bulkConfirmation';
import { APPLICATION_CSV_HEADERS, JOB_STATUSES, type JobStatus } from '../../models';
import SkeletonCard from '../../../../components/skeletonLoader/skeletonCard/SkeletonCard';
import { scrollAndHighlight } from '../../../../helper/highlightElement';
import ToggleButton from '../../../../components/toggleButton/ToggleButton';
import styles from './ViewArchivedApplication.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../../api/useJobTrackerAPI';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../../components/userPreferences/UserPreferencesProvider';
import { getErrorToastMessage } from '../../../../helper/getErrorToastMessage';
import CheckboxFilter from '../../../../components/activityControls/checkboxFilter/CheckboxFilter';
import type { UpdateUserPreferencesRequest } from '../../../../components/userPreferences/models';
import usePendingIds from '../../../../hooks/usePendingIds';
import ApplicationCard from '../../ApplicationCard';
import ActivityControls from '../../../../components/activityControls/ActivityControls';
import DisplayOptions from '../../../../components/activityControls/displayOptions/DisplayOptions';
import MoreOptions from '../../../../components/activityControls/moreOptions/MoreOptions';
import ArchivedApplicationBoard from '../archivedApplicationBoard/ArchivedApplicationBoard';
import ApplicationViewToggle from '../../../../components/activityControls/applicationViewToggle/ApplicationViewToggle';
import type { ApplicationViewMode } from '../../../../components/activityControls/applicationViewToggle/models';
import SkeletonBoard from '../../../../components/skeletonLoader/skeletonBoard/SkeletonBoard';
import EmptyState from '../../../../components/emptyState/EmptyState';
import { routes } from '../../../../routes';
import { createApplicationEmptyState } from '../../applicationEmptyState';

const ViewArchivedApplication = () => {
    const api = useJobTrackerAPI();
    const { preferences, updatePreferences } = useUserPreferences();
    const [archivedApplications, setArchivedApplications] = useState<ArchivedJobApplication[]>([]);
    const location = useLocation();
    const navigate = useNavigate();
    const showCorrespondingAppTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const confirm = useConfirm();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFilteringApplications, setIsFilteringApplications] = useState<boolean>(false);
    const [applicationTotal, setApplicationTotal] = useState(0);
    const [pendingBulkAction, setPendingBulkAction] = useState<'delete' | 'unarchive' | null>(null);
    const bulkActionPendingRef = useRef(false);
    const {
        pendingIds: deletingApplicationIds,
        startPending: startDeletingApplication,
        stopPending: stopDeletingApplication,
    } = usePendingIds();
    const {
        pendingIds: unarchivingApplicationIds,
        startPending: startUnarchivingApplication,
        stopPending: stopUnarchivingApplication,
    } = usePendingIds();
    const { showErrorToast } = useToast();
    const selectedJobStatuses = preferences.archived_application_job_statuses;
    const showNotes = preferences.archived_application_show_notes;
    const viewMode = preferences.archived_application_view_mode;
    const isBoardView = viewMode === 'board';

    const csvData = createApplicationCsvData(archivedApplications);

    const handleViewModeChange = (nextViewMode: ApplicationViewMode) => {
        void handlePreferenceUpdate({ archived_application_view_mode: nextViewMode });
    };

    const handleJobStatusChange = async (jobStatuses: JobStatus[]) => {
        setIsFilteringApplications(true);

        try {
            const archivedApplications = await api.archivedApplication.listApplications({ jobStatuses });
            await updatePreferences({ archived_application_job_statuses: jobStatuses });

            setArchivedApplications(Array.isArray(archivedApplications) ? archivedApplications : []);
            return true;
        } catch (error) {
            showErrorToast(
                getErrorToastMessage(error, 'Unable to filter archived job applications. Please try again.')
            );
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

        const fetchApplications = async () => {
            try {
                const fetchedApplications = await api.archivedApplication.listApplications({
                    jobStatuses: selectedJobStatuses,
                });
                if (isActive) {
                    setArchivedApplications(Array.isArray(fetchedApplications) ? fetchedApplications : []);
                }
            } catch (error) {
                showErrorToast(
                    getErrorToastMessage(error, 'Unable to load archived job applications. Please try again.')
                );
            }

            try {
                const summary = await api.archivedApplication.getSummary();
                if (isActive) {
                    setApplicationTotal(summary.application_count);
                }
            } catch (error) {
                showErrorToast(
                    getErrorToastMessage(error, 'Unable to load archived application counts. Please try again.')
                );
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        void fetchApplications();
        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        const targetApplicationId = location.hash.substring(1);
        if (isLoading || isBoardView || !targetApplicationId) {
            return;
        }

        const targetApplicationIsVisible = archivedApplications.some(
            (application) => String(application.archived_job_id) === targetApplicationId
        );
        if (!targetApplicationIsVisible) {
            return;
        }

        scrollAndHighlight(targetApplicationId, styles.highlighted, showCorrespondingAppTimeout.current);
        navigate(location.pathname, { replace: true });
    }, [archivedApplications, isBoardView, isLoading, location.hash, location.pathname, navigate]);

    const handleDelete = async (archivedJobId: number) => {
        try {
            const { confirmed } = await confirm(createDeleteConfirmation('archived job application'));

            if (!confirmed) {
                return;
            }

            startDeletingApplication(archivedJobId);
            try {
                await api.archivedApplication.deleteApplication({ archivedJobId });
                setArchivedApplications((current) =>
                    current.filter((application) => application.archived_job_id !== archivedJobId)
                );
                setApplicationTotal((current) => Math.max(0, current - 1));
            } finally {
                stopDeletingApplication(archivedJobId);
            }
        } catch (error) {
            showErrorToast(
                getErrorToastMessage(error, 'Unable to delete the archived job application. Please try again.')
            );
        }
    };

    const handleBulkAction = async (action: 'delete' | 'unarchive') => {
        if (bulkActionPendingRef.current) {
            return;
        }

        bulkActionPendingRef.current = true;
        setPendingBulkAction(action);
        let countsLoaded = false;

        try {
            const summary = await api.archivedApplication.getSummary();
            countsLoaded = true;
            setApplicationTotal(summary.application_count);

            if (summary.application_count === 0) {
                setArchivedApplications([]);
                return;
            }

            const confirmation =
                action === 'unarchive'
                    ? createUnarchiveAllConfirmation(summary.application_count, summary.related_interview_count)
                    : createDeleteAllApplicationsConfirmation(
                          summary.application_count,
                          summary.related_interview_count,
                          'archived'
                      );
            const { confirmed } = await confirm(confirmation);

            if (!confirmed) {
                return;
            }

            if (action === 'unarchive') {
                await api.archivedApplication.unarchiveAllApplications();
            } else {
                await api.archivedApplication.deleteAllApplications();
            }

            setArchivedApplications([]);
            setApplicationTotal(0);
        } catch (error) {
            const fallback = !countsLoaded
                ? 'Unable to load archived application counts. Please try again.'
                : action === 'unarchive'
                ? 'Unable to unarchive job applications. Please try again.'
                : 'Unable to delete archived job applications. Please try again.';
            showErrorToast(getErrorToastMessage(error, fallback));
        } finally {
            bulkActionPendingRef.current = false;
            setPendingBulkAction(null);
        }
    };

    const handleUnarchive = async (archivedJobId: number) => {
        startUnarchivingApplication(archivedJobId);
        try {
            await api.archivedApplication.unarchiveApplication({ archivedJobId });
            setArchivedApplications((current) =>
                current.filter((application) => application.archived_job_id !== archivedJobId)
            );
            setApplicationTotal((current) => Math.max(0, current - 1));
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to unarchive the job application. Please try again.'));
        } finally {
            stopUnarchivingApplication(archivedJobId);
        }
    };

    const hasApplications = archivedApplications.length > 0;
    const filtersAreActive = selectedJobStatuses.length !== JOB_STATUSES.length;
    const emptyState = createApplicationEmptyState({
        actionRoute: routes.viewApplications,
        filtersAreActive,
        onClearFilters: () => void handleJobStatusChange([...JOB_STATUSES]),
        variant: 'archived',
    });

    return (
        <div className={`${styles.archivedApplicationList} ${isBoardView ? styles.boardLayout : ''}`}>
            <div className={styles.controlsRow}>
                <ActivityControls>
                    <ApplicationViewToggle currentView={viewMode} onViewChange={handleViewModeChange} />
                    <CheckboxFilter
                        buttonLabel='Filter by'
                        disabled={isLoading}
                        id='archived-application-job-status-filter'
                        onSelectionChange={handleJobStatusChange}
                        options={JOB_STATUSES}
                        selectedOptions={selectedJobStatuses}
                    />
                    {hasApplications && !isBoardView && (
                        <DisplayOptions id='archived-application-display-options'>
                            <ToggleButton
                                toggled={showNotes}
                                onToggle={() =>
                                    void handlePreferenceUpdate({
                                        archived_application_show_notes: !showNotes,
                                    })
                                }
                                label='Show notes'
                            />
                        </DisplayOptions>
                    )}
                    {applicationTotal > 0 && (
                        <MoreOptions
                            csvData={csvData}
                            csvFilename='archived_job_applications.csv'
                            csvHeaders={APPLICATION_CSV_HEADERS}
                            deleteDisabled={pendingBulkAction === 'unarchive'}
                            deleteLabel='Delete all archived applications'
                            id='archived-application-more-options'
                            isDeleting={pendingBulkAction === 'delete'}
                            middleAction={{
                                disabled: pendingBulkAction === 'delete',
                                icon: 'archive',
                                isLoading: pendingBulkAction === 'unarchive',
                                label: 'Unarchive all applications',
                                onClick: () => void handleBulkAction('unarchive'),
                            }}
                            onDelete={() => void handleBulkAction('delete')}
                        />
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
                        <ArchivedApplicationBoard
                            applications={archivedApplications}
                            deletingApplicationIds={deletingApplicationIds}
                            onDelete={handleDelete}
                            onUnarchive={handleUnarchive}
                            selectedJobStatuses={selectedJobStatuses}
                            showNotes={showNotes}
                            unarchivingApplicationIds={unarchivingApplicationIds}
                        />
                    )}

                    {!isBoardView &&
                        archivedApplications.map((application, index) => (
                            <ApplicationCard
                                application={application}
                                index={index}
                                isDeleting={deletingApplicationIds.has(application.archived_job_id)}
                                isUnarchiving={unarchivingApplicationIds.has(application.archived_job_id)}
                                key={application.archived_job_id}
                                onDelete={handleDelete}
                                onUnarchive={handleUnarchive}
                                showNotes={showNotes}
                                variant='archived'
                            />
                        ))}
                </>
            )}
        </div>
    );
};

export default ViewArchivedApplication;
