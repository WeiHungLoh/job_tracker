import { useMemo, useRef } from 'react';
import { createApplicationCsvData } from '../../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../../helper/deleteConfirmation';
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

const DemoViewArchivedApplication = () => {
    const { dispatch, state } = useDemo();
    const { preferences, updatePreferences } = useUserPreferences();
    const archivedApplications = useMemo(() => selectArchivedApplications(state), [state]);
    const showCorrespondingAppTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const confirm = useConfirm();
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

    const handleDeleteAll = async () => {
        const { confirmed } = await confirm(createDeleteConfirmation('archived job application', true));

        if (!confirmed) {
            return;
        }

        dispatch({ type: 'DELETE_ALL_ARCHIVED_APPLICATIONS' });
    };

    const handleRestore = (archivedJobId: number) => {
        dispatch({ type: 'RESTORE_APPLICATION', payload: { archivedJobId } });
    };

    const hasApplications = archivedApplications.length > 0;
    const boardEmptyMessage =
        selectedJobStatuses.length === JOB_STATUSES.length
            ? 'No archived applications found.'
            : 'No archived applications match the selected filters.';

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
                    {hasApplications && (
                        <>
                            {!isBoardView && (
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
                            <MoreOptions
                                csvData={csvData}
                                csvFilename='demo_archived_job_applications.csv'
                                csvHeaders={APPLICATION_CSV_HEADERS}
                                deleteLabel='Delete all archived applications'
                                id='demo-archived-application-more-options'
                                isDeleting={false}
                                onDelete={() => void handleDeleteAll()}
                            />
                        </>
                    )}
                </ActivityControls>
            </div>

            {!hasApplications && !isBoardView && (
                <div>No archived job applications match the selected job statuses. Start archiving now! </div>
            )}

            {!hasApplications && isBoardView && <div className={styles.boardEmptyMessage}>{boardEmptyMessage}</div>}

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
