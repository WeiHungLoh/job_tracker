import { useEffect, useRef, useState } from 'react';
import type { ArchivedJobApplication } from '../../models';
import { createApplicationCsvData } from '../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../helper/deleteConfirmation';
import { APPLICATION_CSV_HEADERS, JOB_STATUSES, type JobStatus } from '../../models';
import SkeletonCard from '../../../../components/skeletonCard/SkeletonCard';
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
    const [isDeletingAll, setIsDeletingAll] = useState(false);
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

    const csvData = createApplicationCsvData(archivedApplications);

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
        if (isLoading || !targetApplicationId) {
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
    }, [archivedApplications, isLoading, location.hash, location.pathname, navigate]);

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
            } finally {
                stopDeletingApplication(archivedJobId);
            }
        } catch (error) {
            showErrorToast(
                getErrorToastMessage(error, 'Unable to delete the archived job application. Please try again.')
            );
        }
    };

    const handleDeleteAll = async () => {
        try {
            const { confirmed } = await confirm(createDeleteConfirmation('archived job application', true));

            if (!confirmed) {
                return;
            }

            setIsDeletingAll(true);
            try {
                await api.archivedApplication.deleteAllApplications();
                setArchivedApplications([]);
            } finally {
                setIsDeletingAll(false);
            }
        } catch (error) {
            showErrorToast(
                getErrorToastMessage(error, 'Unable to delete archived job applications. Please try again.')
            );
        }
    };

    const handleUnarchive = async (archivedJobId: number) => {
        startUnarchivingApplication(archivedJobId);
        try {
            await api.archivedApplication.unarchiveApplication({ archivedJobId });
            setArchivedApplications((current) =>
                current.filter((application) => application.archived_job_id !== archivedJobId)
            );
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to unarchive the job application. Please try again.'));
        } finally {
            stopUnarchivingApplication(archivedJobId);
        }
    };

    const hasApplications = archivedApplications.length > 0;

    return (
        <div className={styles.archivedApplicationList}>
            <ActivityControls>
                <CheckboxFilter
                    buttonLabel='Filter by'
                    disabled={isLoading}
                    id='archived-application-job-status-filter'
                    onSelectionChange={handleJobStatusChange}
                    options={JOB_STATUSES}
                    selectedOptions={selectedJobStatuses}
                />
                {hasApplications && (
                    <>
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
                        <MoreOptions
                            csvData={csvData}
                            csvFilename='archived_job_applications.csv'
                            csvHeaders={APPLICATION_CSV_HEADERS}
                            deleteLabel='Delete all archived applications'
                            id='archived-application-more-options'
                            isDeleting={isDeletingAll}
                            onDelete={() => void handleDeleteAll()}
                        />
                    </>
                )}
            </ActivityControls>

            {(isLoading || isFilteringApplications) && (
                <>
                    <SkeletonCard variant='application' />
                    <SkeletonCard variant='application' />
                </>
            )}

            {!isLoading && !isFilteringApplications && (
                <>
                    {!hasApplications && (
                        <div>
                            No archived job applications match the selected job statuses. Start archiving now!{' '}
                        </div>
                    )}

                    {archivedApplications.map((application, index) => (
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
