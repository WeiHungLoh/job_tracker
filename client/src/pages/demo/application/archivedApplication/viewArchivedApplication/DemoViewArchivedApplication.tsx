import { useMemo, useRef, useState } from 'react';
import { createApplicationCsvData } from '../../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../../helper/deleteConfirmation';
import {
    createDeleteAllApplicationsConfirmation,
    createUnarchiveAllConfirmation,
} from '../../../../../helper/bulkConfirmation';
import { APPLICATION_CSV_HEADERS, JOB_STATUSES, type JobStatus } from '../../../../application/models';
import ToggleButton from '../../../../../components/toggleButton/ToggleButton';
import { useConfirm } from 'material-ui-confirm';
import { useDemo } from '../../../context/DemoContext';
import { useUserPreferences } from '../../../../../components/userPreferences/UserPreferencesProvider';
import ActivityControls from '../../../../../components/activityControls/ActivityControls';
import CheckboxFilter from '../../../../../components/activityControls/checkboxFilter/CheckboxFilter';
import DisplayOptions from '../../../../../components/activityControls/displayOptions/DisplayOptions';
import MoreOptions from '../../../../../components/activityControls/moreOptions/MoreOptions';
import DemoArchivedApplicationBoard from '../archivedApplicationBoard/DemoArchivedApplicationBoard';
import DemoApplicationCard from '../../DemoApplicationCard';
import ApplicationViewToggle from '../../../../../components/activityControls/applicationViewToggle/ApplicationViewToggle';
import type { ApplicationViewMode } from '../../../../../components/activityControls/applicationViewToggle/models';
import { selectArchivedApplications } from '../../../state/demoSelectors';
import styles from './DemoViewArchivedApplication.module.css';
import { useDemoHashHighlight } from '../../../hooks/useDemoHashHighlight';
import EmptyState from '../../../../../components/emptyState/EmptyState';
import { routes } from '../../../../../routes';
import { createApplicationEmptyState } from '../../../../application/applicationEmptyState';

const DemoViewArchivedApplication = () => {
    const { dispatch, state } = useDemo();
    const { preferences, updatePreferences } = useUserPreferences();
    const archivedApplications = useMemo(() => selectArchivedApplications(state), [state]);
    const showCorrespondingAppTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const confirm = useConfirm();
    const [pendingBulkAction, setPendingBulkAction] = useState<'delete' | 'unarchive' | null>(null);
    const bulkActionPendingRef = useRef(false);
    const selectedJobStatuses = preferences.archived_application_job_statuses;
    const showNotes = preferences.archived_application_show_notes;
    const viewMode = preferences.archived_application_view_mode;
    const isBoardView = viewMode === 'board';
    const csvData = createApplicationCsvData(archivedApplications);
    const visibleApplicationIds = useMemo(
        () => archivedApplications.map((application) => String(application.archived_job_id)),
        [archivedApplications]
    );

    useDemoHashHighlight({
        disabled: isBoardView,
        highlightClass: styles.highlighted,
        timeouts: showCorrespondingAppTimeout.current,
        visibleIds: visibleApplicationIds,
    });

    const handleViewModeChange = (nextViewMode: ApplicationViewMode) => {
        void updatePreferences({ archived_application_view_mode: nextViewMode });
    };

    const handleJobStatusChange = async (jobStatuses: JobStatus[]) => {
        await updatePreferences({ archived_application_job_statuses: jobStatuses });
        return true;
    };

    const handleDelete = async (archivedJobId: number) => {
        const { confirmed } = await confirm(createDeleteConfirmation('archived job application'));

        if (!confirmed) {
            return;
        }

        dispatch({ type: 'DELETE_ARCHIVED_APPLICATION', payload: { archivedJobId } });
    };

    const handleBulkAction = async (action: 'delete' | 'unarchive') => {
        if (bulkActionPendingRef.current) {
            return;
        }

        bulkActionPendingRef.current = true;
        setPendingBulkAction(action);
        const applicationIds = new Set(state.archivedApplications.map((application) => application.archived_job_id));
        const interviewCount = state.archivedInterviews.filter((interview) =>
            applicationIds.has(interview.archived_job_id)
        ).length;

        try {
            if (state.archivedApplications.length === 0) {
                return;
            }

            const confirmation =
                action === 'unarchive'
                    ? createUnarchiveAllConfirmation(state.archivedApplications.length, interviewCount)
                    : createDeleteAllApplicationsConfirmation(
                          state.archivedApplications.length,
                          interviewCount,
                          'archived'
                      );
            const { confirmed } = await confirm(confirmation);

            if (!confirmed) {
                return;
            }

            dispatch({
                type: action === 'unarchive' ? 'UNARCHIVE_ALL_APPLICATIONS' : 'DELETE_ALL_ARCHIVED_APPLICATIONS',
            });
        } finally {
            bulkActionPendingRef.current = false;
            setPendingBulkAction(null);
        }
    };

    const handleRestore = (archivedJobId: number) => {
        dispatch({ type: 'RESTORE_APPLICATION', payload: { archivedJobId } });
    };

    const hasApplications = archivedApplications.length > 0;
    const filtersAreActive = selectedJobStatuses.length !== JOB_STATUSES.length;
    const emptyState = createApplicationEmptyState({
        actionRoute: routes.demoViewApplications,
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
                        id='demo-archived-application-job-status-filter'
                        onSelectionChange={handleJobStatusChange}
                        options={JOB_STATUSES}
                        selectedOptions={selectedJobStatuses}
                    />
                    {hasApplications && !isBoardView && (
                        <DisplayOptions id='demo-archived-application-display-options'>
                            <ToggleButton
                                toggled={showNotes}
                                onToggle={() =>
                                    void updatePreferences({
                                        archived_application_show_notes: !showNotes,
                                    })
                                }
                                label='Show notes'
                            />
                        </DisplayOptions>
                    )}
                    {state.archivedApplications.length > 0 && (
                        <MoreOptions
                            csvData={csvData}
                            csvFilename='demo_archived_job_applications.csv'
                            csvHeaders={APPLICATION_CSV_HEADERS}
                            deleteLabel='Delete all archived applications'
                            id='demo-archived-application-more-options'
                            deleteDisabled={pendingBulkAction === 'unarchive'}
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

            {!hasApplications && <EmptyState {...emptyState} />}

            {hasApplications && isBoardView && (
                <DemoArchivedApplicationBoard
                    applications={archivedApplications}
                    deletingApplicationIds={new Set<number>()}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                    restoringApplicationIds={new Set<number>()}
                    selectedJobStatuses={selectedJobStatuses}
                    showNotes={showNotes}
                />
            )}

            {!isBoardView &&
                archivedApplications.map((application, index) => (
                    <DemoApplicationCard
                        application={application}
                        index={index}
                        isDeleting={false}
                        isRestoring={false}
                        key={application.archived_job_id}
                        onDelete={handleDelete}
                        onRestore={handleRestore}
                        showNotes={showNotes}
                        variant='archived'
                    />
                ))}
        </div>
    );
};

export default DemoViewArchivedApplication;
