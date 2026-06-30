import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createApplicationCsvData } from '../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../helper/deleteConfirmation';
import type { JobInterview } from '../../../interview/models';
import SkeletonCard from '../../../../components/skeletonCard/SkeletonCard';
import PrimaryButton from '../../../../components/button/PrimaryButton';
import { APPLICATION_CSV_HEADERS, JOB_STATUSES, type JobApplication, type JobStatus } from '../../models';
import { scrollAndHighlight } from '../../../../helper/highlightElement';
import styles from './ViewApplication.module.css';
import ToggleButton from '../../../../components/toggleButton/ToggleButton';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../../api/useJobTrackerAPI';
import { useToast } from '../../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../../components/userPreferences/UserPreferencesProvider';
import { getErrorToastMessage } from '../../../../helper/getErrorToastMessage';
import { FIELD_MAX_LENGTHS } from '../../../../helper/formValidation';
import CheckboxFilter from '../../../../components/checkboxFilter/CheckboxFilter';
import ApplicationControls from '../../../../components/applicationControls/ApplicationControls';
import type { UpdateUserPreferencesRequest } from '../../../../components/userPreferences/models';
import CsvExportButton from '../../../../components/csvExportButton/CsvExportButton';
import usePendingIds from '../../../../hooks/usePendingIds';
import ApplicationCard from '../../ApplicationCard';

const JOB_STATUS_ORDER: Record<JobStatus, number> = {
    Accepted: 1,
    Offer: 2,
    Declined: 3,
    Interview: 4,
    Applied: 5,
    Ghosted: 6,
    Rejected: 7,
};

const sortApplications = (applications: JobApplication[]) => {
    return [...applications].sort((firstApplication, secondApplication) => {
        const byStatus = JOB_STATUS_ORDER[firstApplication.job_status] - JOB_STATUS_ORDER[secondApplication.job_status];

        return (
            byStatus || Date.parse(secondApplication.application_date) - Date.parse(firstApplication.application_date)
        );
    });
};

const ViewApplication = () => {
    const api = useJobTrackerAPI();
    const { preferences, updatePreferences } = useUserPreferences();
    const location = useLocation();
    const navigate = useNavigate();
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [editedJobStatuses, setEditedJobStatuses] = useState<Record<number, JobStatus>>({});
    const [interviews, setInterviews] = useState<JobInterview[]>([]);
    const confirm = useConfirm();
    const showNotesTimeout = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
    const showEditStatusTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const showCorrespondingAppTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFilteringApplications, setIsFilteringApplications] = useState<boolean>(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
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
    const { showErrorToast } = useToast();
    const selectedJobStatuses = preferences.application_job_statuses;
    const showArchive = preferences.application_show_archive;
    const showNotes = preferences.application_show_notes;
    const enableScroll = preferences.application_enable_scroll;

    const csvData = createApplicationCsvData(applications);

    const interviewJobIdSet = useMemo(() => new Set(interviews.map((interview) => interview.job_id)), [interviews]);

    const upcomingInterviewCountByJob = useMemo(() => {
        const now = new Date();
        const counts: Record<number, number> = {};
        interviews.forEach((interview) => {
            if (new Date(interview.interview_date) > now) {
                counts[interview.job_id] = (counts[interview.job_id] || 0) + 1;
            }
        });
        return counts;
    }, [interviews]);

    const handleJobStatusChange = async (jobStatuses: JobStatus[]) => {
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
            try {
                const [jobApplications, jobInterviews] = await Promise.all([
                    api.application.listApplications({ jobStatuses: selectedJobStatuses }),
                    api.interview.listInterviews(),
                ]);

                if (isActive) {
                    setApplications(Array.isArray(jobApplications) ? jobApplications : []);
                    setInterviews(Array.isArray(jobInterviews) ? jobInterviews : []);
                }
            } catch (error) {
                showErrorToast(getErrorToastMessage(error, 'Unable to load job application data. Please try again.'));
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
        if (isLoading || !targetApplicationId) {
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
    }, [applications, isLoading, location.hash, location.pathname, navigate]);

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
            } finally {
                stopDeletingApplication(jobId);
            }
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to delete the job application. Please try again.'));
        }
    };

    const handleDeleteAll = async () => {
        try {
            const { confirmed } = await confirm(createDeleteConfirmation('job application', true));

            if (!confirmed) {
                return;
            }

            setIsDeletingAll(true);
            try {
                await api.application.deleteAllApplications();
                setApplications([]);
                setInterviews([]);
            } finally {
                setIsDeletingAll(false);
            }
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to delete job applications. Please try again.'));
        }
    };

    const toggleEditStatus = async (application: JobApplication) => {
        const editStatus = application.edit_status;
        const newStatus = editedJobStatuses[application.job_id] ?? application.job_status;
        const oldStatus = application.job_status;
        const isSaving = editStatus;
        const statusChanged = newStatus !== oldStatus;

        try {
            await api.application.updateStatus({
                jobId: application.job_id,
                editStatus: !editStatus,
                jobStatus: isSaving ? newStatus : oldStatus,
            });

            if (isSaving) {
                setEditedJobStatuses((currentStatuses) => {
                    const updatedStatuses = { ...currentStatuses };
                    delete updatedStatuses[application.job_id];
                    return updatedStatuses;
                });

                if (!selectedJobStatuses.includes(newStatus)) {
                    setApplications((current) => current.filter((item) => item.job_id !== application.job_id));
                    return;
                }
            }

            setApplications((current) => {
                const updatedApplications = current.map((item) =>
                    item.job_id === application.job_id
                        ? { ...item, edit_status: !editStatus, job_status: isSaving ? newStatus : oldStatus }
                        : item
                );
                return isSaving && statusChanged ? sortApplications(updatedApplications) : updatedApplications;
            });

            if (isSaving && statusChanged && enableScroll) {
                setTimeout(() => {
                    scrollAndHighlight(String(application.job_id), styles.highlighted, showEditStatusTimeout.current);
                }, 100);
            }
        } catch (error) {
            showErrorToast(
                getErrorToastMessage(error, 'Unable to update the job application status. Please try again.')
            );
        }
    };

    const handleArchive = async (jobId: number) => {
        startArchivingApplication(jobId);
        try {
            await api.archivedApplication.archiveApplication({ jobId });
            setApplications((current) => current.filter((application) => application.job_id !== jobId));
            setInterviews((current) => current.filter((interview) => interview.job_id !== jobId));
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to archive the job application. Please try again.'));
        } finally {
            stopArchivingApplication(jobId);
        }
    };

    const hasApplications = applications.length > 0;

    return (
        <div className={styles.applicationList}>
            <ApplicationControls
                filter={
                    <CheckboxFilter
                        buttonLabel='Job status'
                        disabled={isLoading}
                        id='application-job-status-filter'
                        label='Filter by'
                        onSelectionChange={handleJobStatusChange}
                        options={JOB_STATUSES}
                        selectedOptions={selectedJobStatuses}
                    />
                }
                viewOptions={
                    hasApplications ? (
                        <>
                            <ToggleButton
                                toggled={enableScroll}
                                onToggle={() =>
                                    void handlePreferenceUpdate({
                                        application_enable_scroll: !enableScroll,
                                    })
                                }
                                label='Enable Auto-Scroll'
                                toggledLabel='Disable Auto-Scroll'
                                color='blue'
                            />
                            <ToggleButton
                                data-testid='unhide-archive'
                                toggled={showArchive}
                                onToggle={() =>
                                    void handlePreferenceUpdate({
                                        application_show_archive: !showArchive,
                                    })
                                }
                                label='Unhide Archive'
                                toggledLabel='Hide Archive'
                            />
                            <ToggleButton
                                toggled={showNotes}
                                onToggle={() =>
                                    void handlePreferenceUpdate({
                                        application_show_notes: !showNotes,
                                    })
                                }
                                label='Unhide Notes'
                                toggledLabel='Hide Notes'
                                color='yellow'
                            />
                        </>
                    ) : undefined
                }
            />

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
                            <br />
                            No job applications match the selected job statuses. Start adding one now!{' '}
                        </div>
                    )}

                    {applications.map((application, index) => (
                        <ApplicationCard
                            application={application}
                            editedJobStatus={editedJobStatuses[application.job_id] ?? application.job_status}
                            hasInterview={interviewJobIdSet.has(application.job_id)}
                            index={index}
                            isArchiving={archivingApplicationIds.has(application.job_id)}
                            isDeleting={deletingApplicationIds.has(application.job_id)}
                            key={application.job_id}
                            note={notes[application.job_id] ?? application.notes}
                            onArchive={handleArchive}
                            onDelete={handleDelete}
                            onEditNotes={handleEditNotes}
                            onJobStatusChange={(jobId, jobStatus) =>
                                setEditedJobStatuses((currentStatuses) => ({
                                    ...currentStatuses,
                                    [jobId]: jobStatus,
                                }))
                            }
                            onToggleEditStatus={toggleEditStatus}
                            showArchive={showArchive}
                            showNotes={showNotes}
                            upcomingInterviewCount={upcomingInterviewCountByJob[application.job_id] ?? 0}
                            variant='job'
                        />
                    ))}

                    <div className={styles.applicationButton}>
                        {hasApplications && (
                            <>
                                <PrimaryButton
                                    isLoading={isDeletingAll}
                                    variant='destructive'
                                    onClick={() => handleDeleteAll()}
                                >
                                    Delete all applications
                                </PrimaryButton>
                                <CsvExportButton
                                    data={csvData}
                                    headers={APPLICATION_CSV_HEADERS}
                                    filename='job_applications.csv'
                                />
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ViewApplication;
