import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CSVLink } from 'react-csv';
import formatDate from '../../../helper/dateFormatter';
import type { JobInterview } from '../../interview/models';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import {
    APPLICATION_CSV_HEADERS,
    JOB_STATUSES,
    JOB_STATUS_FILTER_OPTIONS,
    type JobApplication,
    type JobStatus,
    type JobStatusFilter,
} from '../models';
import { routes } from '../../../routes';
import { scrollAndHighlight } from '../../../helper/highlightElement';
import styles from './ViewApplication.module.css';
import ToggleButton from '../../../components/toggleButton/ToggleButton';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useToast } from '../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../components/userPreferences/UserPreferencesProvider';

const jobStatusOrder: Record<JobStatus, number> = {
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
        const byStatus = jobStatusOrder[firstApplication.job_status] - jobStatusOrder[secondApplication.job_status];

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
    const [jobStatuses, setJobStatuses] = useState<Record<number, JobStatus>>({});
    const [interviews, setInterviews] = useState<JobInterview[]>([]);
    const confirm = useConfirm();
    const showNotesTimeout = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
    const showEditStatusTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const showCorrespondingAppTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isFilteringApplications, setIsFilteringApplications] = useState(false);
    const { showErrorToast } = useToast();
    const jobStatus = preferences.application_job_status;
    const toggleArchived = preferences.application_show_archive;
    const toggleNotes = preferences.application_show_notes;
    const toggleScroll = preferences.application_enable_scroll;

    const data = applications.map((app) => ({
        ...app,
        application_date: formatDate(app.application_date).formattedDate,
        job_location: app.job_location ? app.job_location : 'N/A',
        job_posting_url: app.job_posting_url ? app.job_posting_url : 'N/A',
        notes: app.notes ? app.notes : 'N/A',
    }));

    const interviewJobIdSet = useMemo(() => new Set(interviews.map((interview) => interview.job_id)), [interviews]);

    const upcomingInterviewCountByJob = useMemo(() => {
        const now = new Date();
        const counts: Record<number, number> = {};
        interviews.forEach((iv) => {
            if (new Date(iv.interview_date) > now) {
                counts[iv.job_id] = (counts[iv.job_id] || 0) + 1;
            }
        });
        return counts;
    }, [interviews]);

    const handleJobStatusChange = async (selectedStatus: JobStatusFilter) => {
        setIsFilteringApplications(true);

        try {
            const [, jobApplications] = await Promise.all([
                updatePreferences({ application_job_status: selectedStatus }),
                api.application.listApplications({ jobStatus: selectedStatus }),
            ]);
            setApplications(Array.isArray(jobApplications) ? jobApplications : []);
        } catch (error) {
            showErrorToast((error as Error).message);
        } finally {
            setIsFilteringApplications(false);
        }
    };

    useEffect(() => {
        let isActive = true;

        const fetchData = async () => {
            try {
                const [jobApplications, jobInterviews] = await Promise.all([
                    api.application.listApplications({ jobStatus }),
                    api.interview.listInterviews(),
                ]);

                if (isActive) {
                    setApplications(Array.isArray(jobApplications) ? jobApplications : []);
                    setInterviews(Array.isArray(jobInterviews) ? jobInterviews : []);
                }
            } catch (error) {
                showErrorToast((error as Error).message);
            } finally {
                if (isActive) setIsLoading(false);
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
        setNotes({ ...notes, [jobId]: editedNotes });

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
                showErrorToast((error as Error).message);
            }
        }, 500);
    };

    const handleDelete = async (applicationId: number) => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description:
                    'Are you sure you want to delete this job application? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true },
            });

            if (confirmed) {
                await api.application.deleteApplication({ applicationId });
                setApplications((current) => current.filter((application) => application.job_id !== applicationId));
                setInterviews((current) => current.filter((interview) => interview.job_id !== applicationId));
            }
        } catch (error) {
            showErrorToast((error as Error).message);
            return;
        }
    };

    const handleDeleteAll = async () => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description:
                    'Are you sure you want to delete all job applications? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            });

            if (confirmed) {
                await api.application.deleteAllApplications();
                setApplications([]);
                setInterviews([]);
            }
        } catch (error) {
            showErrorToast((error as Error).message);
        }
    };

    const toggleEditStatus = async (application: JobApplication) => {
        const editStatus = application.edit_status;
        const newStatus = jobStatuses[application.job_id] ?? application.job_status;
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
                    jobStatus: jobStatuses[application.job_id] ?? application.job_status,
                });

                if (jobStatus === 'Show All') {
                    setApplications((current) => {
                        const updatedApplications = current.map((item) =>
                            item.job_id === application.job_id ? { ...item, job_status: newStatus } : item
                        );
                        return sortApplications(updatedApplications);
                    });

                    if (toggleScroll) {
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
            showErrorToast((error as Error).message);
        }
    };

    const handleArchive = async (jobId: number) => {
        try {
            await api.archivedApplication.archiveApplication({ jobId });
            setApplications((current) => current.filter((application) => application.job_id !== jobId));
            setInterviews((current) => current.filter((interview) => interview.job_id !== jobId));
        } catch (error) {
            showErrorToast('Failed to archive an application ' + (error as Error).message);
        }
    };

    const jobStatusClassMap: Record<JobStatus, string> = {
        Accepted: styles.accepted,
        Applied: styles.applied,
        Declined: styles.declined,
        Ghosted: styles.ghosted,
        Interview: styles.interview,
        Offer: styles.offer,
        Rejected: styles.rejected,
    };

    const hasApplications = applications.length !== 0;

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
                    <div className={styles.listControls}>
                        <div className={styles.filterOption}>
                            <div>Filter by</div>
                            <select
                                disabled={isFilteringApplications}
                                value={jobStatus}
                                onChange={(event) => void handleJobStatusChange(event.target.value as JobStatusFilter)}
                            >
                                {JOB_STATUS_FILTER_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {hasApplications && (
                            <ToggleButton
                                toggled={toggleScroll}
                                onToggle={() => void updatePreferences({ application_enable_scroll: !toggleScroll })}
                                label='Enable Auto-Scroll'
                                toggledLabel='Disable Auto-Scroll'
                                color='blue'
                            />
                        )}

                        {hasApplications && (
                            <ToggleButton
                                data-testid='unhide-archive'
                                toggled={toggleArchived}
                                onToggle={() => void updatePreferences({ application_show_archive: !toggleArchived })}
                                label='Unhide Archive'
                                toggledLabel='Hide Archive'
                            />
                        )}

                        {hasApplications && (
                            <ToggleButton
                                toggled={toggleNotes}
                                onToggle={() => void updatePreferences({ application_show_notes: !toggleNotes })}
                                label='Unhide Notes'
                                toggledLabel='Hide Notes'
                                color='yellow'
                            />
                        )}
                    </div>

                    {isFilteringApplications && (
                        <div className={styles.filterLoading}>
                            <LoadingSpinner />
                        </div>
                    )}

                    {!hasApplications && (
                        <div>
                            <br />
                            No job application with that job status found. Start adding one now!{' '}
                        </div>
                    )}

                    {applications &&
                        applications.map((application, index) => (
                            <div
                                className={styles.application}
                                key={application.job_id}
                                id={String(application.job_id)}
                            >
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
                                        <p className={jobStatusClassMap[application.job_status]}>
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
                                            value={jobStatuses[application.job_id] ?? application.job_status}
                                            onChange={(e) =>
                                                setJobStatuses((app) => ({
                                                    ...app,
                                                    [application.job_id]: e.target.value as JobStatus,
                                                }))
                                            }
                                        >
                                            {JOB_STATUSES.map((status) => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                    disabled={
                                                        status === 'Applied' &&
                                                        interviewJobIdSet.has(application.job_id)
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
                                            rel='noreferrer noopenner'
                                        >
                                            Click here to head to job application URL
                                        </a>
                                    )}
                                </div>

                                <div className={styles.buttonGroup}>
                                    <PrimaryButton variant='secondary' onClick={() => toggleEditStatus(application)}>
                                        {application.edit_status ? 'Save Changes' : 'Edit Status'}
                                    </PrimaryButton>

                                    <PrimaryButton
                                        variant='destructive'
                                        onClick={() => handleDelete(application.job_id)}
                                    >
                                        Delete
                                    </PrimaryButton>

                                    <PrimaryButton
                                        className={`${styles.archiveButton} ${
                                            !toggleArchived ? styles.archiveHidden : ''
                                        }`}
                                        onClick={() => handleArchive(application.job_id)}
                                        variant='secondary'
                                    >
                                        Archive
                                    </PrimaryButton>
                                </div>

                                {toggleNotes && (
                                    <div className={styles.notes}>
                                        <textarea
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
                                        data={data}
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
