import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CSVLink } from 'react-csv';
import formatDate from '../../../helper/dateFormatter';
import { createApplicationCsvData } from '../../../helper/csvData';
import { createDeleteConfirmation } from '../../../helper/deleteConfirmation';
import type { JobInterview } from '../../interview/models';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { APPLICATION_CSV_HEADERS, JOB_STATUSES, type JobApplication, type JobStatus } from '../models';
import { routes } from '../../../routes';
import { scrollAndHighlight } from '../../../helper/highlightElement';
import styles from './ViewApplication.module.css';
import ToggleButton from '../../../components/toggleButton/ToggleButton';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useToast } from '../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../components/userPreferences/UserPreferencesProvider';
import { getErrorToastMessage } from '../../../helper/getErrorToastMessage';
import { FIELD_MAX_LENGTHS } from '../../../helper/formValidation';
import CheckboxFilter from '../../../components/checkboxFilter/CheckboxFilter';
import ApplicationControls from '../../../components/applicationControls/ApplicationControls';

const JOB_STATUS_ORDER: Record<JobStatus, number> = {
    Accepted: 1,
    Offer: 2,
    Declined: 3,
    Interview: 4,
    Applied: 5,
    Ghosted: 6,
    Rejected: 7,
};

const JOB_STATUS_CLASS_MAP: Record<JobStatus, string> = {
    Accepted: styles.accepted,
    Applied: styles.applied,
    Declined: styles.declined,
    Ghosted: styles.ghosted,
    Interview: styles.interview,
    Offer: styles.offer,
    Rejected: styles.rejected,
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
            const [, jobApplications] = await Promise.all([
                updatePreferences({ application_job_statuses: jobStatuses }),
                api.application.listApplications({ jobStatuses }),
            ]);

            setApplications(Array.isArray(jobApplications) ? jobApplications : []);
            return true;
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to filter job applications. Please try again.'));
            return false;
        } finally {
            setIsFilteringApplications(false);
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

            if (confirmed) {
                await api.application.deleteApplication({ jobId });
                setApplications((current) => current.filter((application) => application.job_id !== jobId));
                setInterviews((current) => current.filter((interview) => interview.job_id !== jobId));
            }
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to delete the job application. Please try again.'));
        }
    };

    const handleDeleteAll = async () => {
        try {
            const { confirmed } = await confirm(createDeleteConfirmation('job application', true));

            if (confirmed) {
                await api.application.deleteAllApplications();
                setApplications([]);
                setInterviews([]);
            }
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to delete job applications. Please try again.'));
        }
    };

    const toggleEditStatus = async (application: JobApplication) => {
        const editStatus = application.edit_status;
        const newStatus = editedJobStatuses[application.job_id] ?? application.job_status;
        const oldStatus = application.job_status;
        try {
            await api.application.updateEditStatus({
                jobId: application.job_id,
                editStatus: !editStatus,
            });
            setApplications((current) =>
                current.map((item) =>
                    item.job_id === application.job_id ? { ...item, edit_status: !item.edit_status } : item
                )
            );

            if (editStatus && newStatus !== oldStatus) {
                await api.application.updateJobStatus({
                    jobId: application.job_id,
                    jobStatus: newStatus,
                });

                if (selectedJobStatuses.includes(newStatus)) {
                    setApplications((current) => {
                        const updatedApplications = current.map((item) =>
                            item.job_id === application.job_id ? { ...item, job_status: newStatus } : item
                        );
                        return sortApplications(updatedApplications);
                    });

                    if (enableScroll) {
                        setTimeout(() => {
                            scrollAndHighlight(
                                String(application.job_id),
                                styles.highlighted,
                                showEditStatusTimeout.current
                            );
                        }, 100);
                    }
                } else {
                    setApplications((current) => current.filter((item) => item.job_id !== application.job_id));
                }
            }
        } catch (error) {
            showErrorToast(
                getErrorToastMessage(error, 'Unable to update the job application status. Please try again.')
            );
        }
    };

    const handleArchive = async (jobId: number) => {
        try {
            await api.archivedApplication.archiveApplication({ jobId });
            setApplications((current) => current.filter((application) => application.job_id !== jobId));
            setInterviews((current) => current.filter((interview) => interview.job_id !== jobId));
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to archive the job application. Please try again.'));
        }
    };

    const hasApplications = applications.length > 0;

    return (
        <div className={styles.applicationList}>
            {isLoading && (
                <>
                    <br />
                    <LoadingSpinner />
                </>
            )}

            {!isLoading && (
                <>
                    <ApplicationControls
                        filter={
                            <CheckboxFilter
                                buttonLabel='Job status'
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
                                            void updatePreferences({ application_enable_scroll: !enableScroll })
                                        }
                                        label='Enable Auto-Scroll'
                                        toggledLabel='Disable Auto-Scroll'
                                        color='blue'
                                    />
                                    <ToggleButton
                                        data-testid='unhide-archive'
                                        toggled={showArchive}
                                        onToggle={() =>
                                            void updatePreferences({ application_show_archive: !showArchive })
                                        }
                                        label='Unhide Archive'
                                        toggledLabel='Hide Archive'
                                    />
                                    <ToggleButton
                                        toggled={showNotes}
                                        onToggle={() => void updatePreferences({ application_show_notes: !showNotes })}
                                        label='Unhide Notes'
                                        toggledLabel='Hide Notes'
                                        color='yellow'
                                    />
                                </>
                            ) : undefined
                        }
                    />

                    {isFilteringApplications && (
                        <div className={styles.filterLoading}>
                            <LoadingSpinner />
                        </div>
                    )}

                    {!hasApplications && (
                        <div>
                            <br />
                            No job applications match the selected job statuses. Start adding one now!{' '}
                        </div>
                    )}

                    {applications.map((application, index) => (
                        <div className={styles.application} key={application.job_id} id={String(application.job_id)}>
                            <div className={styles.applicationContent}>
                                <h2>
                                    {index + 1}. {application.company_name}
                                </h2>
                                <p>Job Title: {application.job_title}</p>
                                {application.job_location !== '' && (
                                    <p className={styles.location}>Location: {application.job_location}</p>
                                )}
                                <p className={styles.date}>
                                    Application Date: {formatDate(application.application_date).formattedDate}
                                </p>
                                <p>
                                    Time since application:{' '}
                                    {formatDate(application.application_date).timeSinceApplication}
                                </p>
                                <div className={styles.badgeGroup}>
                                    <p className={JOB_STATUS_CLASS_MAP[application.job_status]}>
                                        Job Status: {application.job_status}
                                    </p>
                                    {upcomingInterviewCountByJob[application.job_id] > 0 && (
                                        <span className={styles.upcomingBadge}>
                                            {upcomingInterviewCountByJob[application.job_id]} Upcoming Interview
                                            {upcomingInterviewCountByJob[application.job_id] > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>

                                {application.edit_status && (
                                    <select
                                        role='listbox'
                                        value={editedJobStatuses[application.job_id] ?? application.job_status}
                                        onChange={(e) =>
                                            setEditedJobStatuses((currentStatuses) => ({
                                                ...currentStatuses,
                                                [application.job_id]: e.target.value as JobStatus,
                                            }))
                                        }
                                    >
                                        {JOB_STATUSES.map((status) => (
                                            <option
                                                key={status}
                                                value={status}
                                                disabled={
                                                    status === 'Applied' && interviewJobIdSet.has(application.job_id)
                                                }
                                            >
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {application.job_status === 'Interview' && (
                                    <Link
                                        to={routes.addInterview}
                                        state={{
                                            app: application,
                                        }}
                                    >
                                        Click here to add an interview
                                    </Link>
                                )}
                                {application.job_posting_url !== '' && (
                                    <a
                                        className={styles.url}
                                        href={application.job_posting_url}
                                        target='_blank'
                                        rel='noreferrer noopener'
                                    >
                                        Click here to head to job application URL
                                    </a>
                                )}
                            </div>

                            <div className={styles.buttonGroup}>
                                <PrimaryButton variant='secondary' onClick={() => toggleEditStatus(application)}>
                                    {application.edit_status ? 'Save Changes' : 'Edit Status'}
                                </PrimaryButton>

                                <PrimaryButton variant='destructive' onClick={() => handleDelete(application.job_id)}>
                                    Delete
                                </PrimaryButton>

                                <PrimaryButton
                                    className={`${styles.archiveButton} ${!showArchive ? styles.archiveHidden : ''}`}
                                    onClick={() => handleArchive(application.job_id)}
                                    variant='secondary'
                                >
                                    Archive
                                </PrimaryButton>
                            </div>

                            {showNotes && (
                                <div className={styles.notes}>
                                    <textarea
                                        maxLength={FIELD_MAX_LENGTHS.notes}
                                        value={notes[application.job_id] ?? application.notes}
                                        onChange={(e) => handleEditNotes(application.job_id, e.target.value)}
                                        placeholder='Add your notes here'
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    <div className={styles.applicationButton}>
                        {hasApplications && (
                            <>
                                <PrimaryButton variant='destructive' onClick={() => handleDeleteAll()}>
                                    Delete all applications
                                </PrimaryButton>
                                <PrimaryButton variant='secondary'>
                                    <CSVLink
                                        data={csvData}
                                        headers={APPLICATION_CSV_HEADERS}
                                        filename={'job_applications.csv'}
                                        style={{ color: 'inherit', textDecoration: 'none' }}
                                    >
                                        Export as CSV
                                    </CSVLink>
                                </PrimaryButton>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ViewApplication;
