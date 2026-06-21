import type { EntityId, JobApplication, JobStatus } from '../models';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import ArchiveToggleButton from '../../../components/archiveToggleButton/ArchiveToggleButton';
// Taken from: https://www.npmjs.com/package/react-csv
import { CSVLink } from 'react-csv';
import DateFormatter from '../../../helper/dateFormatter';
import type { JobInterview } from '../../interview/models';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import NotesToggleButton from '../../../components/notesToggleButton/NotesToggleButton';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { routes } from '../../../routes';
import styles from './ViewApplication.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useToast } from '../../../components/toast/ToastProvider';

const ViewApplication = () => {
    const navigate = useNavigate();
    const api = useJobTrackerAPI();
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [jobStatuses, setJobStatuses] = useState<Record<EntityId, JobStatus>>({});
    const [interviews, setInterviews] = useState<JobInterview[]>([]);
    const [toggleArchived, setToggleArchived] = useState(false);
    const [toggleNotes, setToggleNotes] = useState(false);
    const confirm = useConfirm();
    const [jobStatus, setJobStatus] = useState('Show All');
    const showNotesTimeout = useRef<Record<EntityId, ReturnType<typeof setTimeout>>>({});
    const showEditStatusTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const showCorrespondingAppTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const [notes, setNotes] = useState<Record<EntityId, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const { showErrorToast } = useToast();

    const filteredApplications = applications.filter((app) => {
        if (jobStatus === 'Show All') {
            return true;
        } else {
            return app.job_status === jobStatus;
        }
    });

    const headers = [
        { label: 'Company', key: 'company_name' },
        { label: 'Job Title', key: 'job_title' },
        { label: 'Application Date', key: 'application_date' },
        { label: 'Status', key: 'job_status' },
        { label: 'Location', key: 'job_location' },
        { label: 'Job URL', key: 'job_posting_url' },
        { label: 'Notes', key: 'notes' },
    ];

    const data = filteredApplications.map((app) => ({
        ...app,
        application_date: DateFormatter(app.application_date).formattedDate,
        job_location: app.job_location ? app.job_location : 'N/A',
        job_posting_url: app.job_posting_url ? app.job_posting_url : 'N/A',
        notes: app.notes ? app.notes : 'N/A',
    }));

    const interviewJobIds = interviews.map((interview) => interview.job_id);

    useEffect(() => {
        let isActive = true;

        const fetchData = async () => {
            try {
                const [jobApplications, jobInterviews] = await Promise.all([
                    api.application.listApplications(),
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
        // Obtain application.job_id from <Link> in AddInterview
        const hash = location.hash;
        if (hash) {
            setTimeout(() => {
                // Ignores the first string character # to get job_id
                const app = document.getElementById(hash.substring(1));
                if (app) {
                    const taskId = showCorrespondingAppTimeout.current[app as unknown as string];
                    if (taskId) {
                        clearTimeout(taskId);
                    }
                    app.classList.remove(styles.highlighted);

                    app.scrollIntoView({ behavior: 'smooth' });
                    // Add the 'highlighted' class when the application scrolls into view,
                    // and remove it after 4 seconds to match transition time
                    app.classList.add(styles.highlighted);
                    showCorrespondingAppTimeout.current[app as unknown as string] = setTimeout(() => {
                        app.classList.remove(styles.highlighted);
                    }, 4000);
                }
            }, 100);
        }
    }, [location]);

    const handleEditNotes = (jobId: EntityId, editedNotes: string) => {
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

    const handleDelete = async (applicationId: EntityId) => {
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

            if (editStatus && newStatus != oldStatus) {
                await api.application.updateJobStatus({
                    jobId: application.job_id,
                    jobStatus: jobStatuses[application.job_id] ?? application.job_status,
                });
                setApplications((current) =>
                    current.map((item) =>
                        item.job_id === application.job_id ? { ...item, job_status: newStatus } : item
                    )
                );

                setTimeout(() => {
                    const app = document.getElementById(String(application.job_id));
                    if (app) {
                        const taskId = showEditStatusTimeout.current[app as unknown as string];
                        if (taskId) {
                            clearTimeout(taskId);
                        }
                        app.classList.remove(styles.highlighted);
                        app.scrollIntoView({ behavior: 'smooth' });

                        // Add the 'highlighted' class when the application scrolls into view,
                        // and remove it after 4 seconds to match transition time
                        app.classList.add(styles.highlighted);
                        showEditStatusTimeout.current[app as unknown as string] = setTimeout(() => {
                            app.classList.remove(styles.highlighted);
                        }, 4000);
                    }
                }, 100);
            }
        } catch (error) {
            showErrorToast((error as Error).message);
        }
    };

    const handleArchive = async (jobId: EntityId) => {
        try {
            await api.archivedApplication.archiveApplication({ jobId });
            setApplications((current) => current.filter((application) => application.job_id !== jobId));
            setInterviews((current) => current.filter((interview) => interview.job_id !== jobId));
        } catch (error) {
            showErrorToast('Failed to archive an application ' + (error as Error).message);
        }
    };

    const isEditStatus = (editStatus: boolean) => {
        return editStatus;
    };

    const isStatusInterview = (jobStatus: JobStatus) => {
        if (jobStatus === 'Interview') {
            return true;
        }
        return false;
    };

    const showAddApplicationMessage = (applications: JobApplication[]) => {
        return applications && applications.length === 0;
    };

    const hasApplications = (applications: JobApplication[]) => {
        return applications && applications.length !== 0;
    };

    const showJobLocation = (field: JobApplication) => {
        if (field.job_location === '') {
            return false;
        }
        return true;
    };

    const showJobURL = (field: JobApplication) => {
        if (field.job_posting_url === '') {
            return false;
        }
        return true;
    };

    const checkJobStatus = (application: JobApplication) => {
        const jobStatus = application.job_status;

        if (jobStatus === 'Accepted') {
            return styles.accepted;
        } else if (jobStatus === 'Applied') {
            return styles.applied;
        } else if (jobStatus === 'Declined') {
            return styles.declined;
        } else if (jobStatus === 'Ghosted') {
            return styles.ghosted;
        } else if (jobStatus === 'Interview') {
            return styles.interview;
        } else if (jobStatus === 'Offer') {
            return styles.offer;
        } else {
            return styles.rejected;
        }
    };

    return (
        <div className={styles.applicationList}>
            {isLoading && <><br /><LoadingSpinner /></>}

            {!isLoading && (
                <>
                    <div className={styles.listControls}>
                        <div className={styles.filterOption}>
                            <div>Filter by</div>
                            <select value={jobStatus} onChange={(e) => setJobStatus(e.target.value)}>
                                <option value='Show All'>Show All</option>
                                <option value='Accepted'>Accepted</option>
                                <option value='Applied'>Applied</option>
                                <option value='Declined'>Declined</option>
                                <option value='Ghosted'>Ghosted</option>
                                <option value='Interview'>Interview</option>
                                <option value='Offer'>Offer</option>
                                <option value='Rejected'>Rejected</option>
                            </select>
                        </div>

                        {hasApplications(filteredApplications) && (
                            <ArchiveToggleButton
                                data-testid='unhide-archive'
                                toggled={toggleArchived}
                                onToggle={() => setToggleArchived(!toggleArchived)}
                            />
                        )}

                        {hasApplications(filteredApplications) && (
                            <NotesToggleButton toggled={toggleNotes} onToggle={() => setToggleNotes(!toggleNotes)} />
                        )}
                    </div>

                    {showAddApplicationMessage(filteredApplications) && (
                        <div>
                            <br />
                            No job application with that job status found. Start adding one now!{' '}
                        </div>
                    )}

                    {filteredApplications &&
                        filteredApplications.map((application, index) => (
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
                                    {showJobLocation(application) && (
                                        <p className={styles.location}>Location: {application.job_location}</p>
                                    )}
                                    <p className={styles.date}>
                                        Application Date: {DateFormatter(application.application_date).formattedDate}
                                    </p>
                                    <p>
                                        Time since application:{' '}
                                        {DateFormatter(application.application_date).timeSinceApplication}
                                    </p>
                                    <p className={checkJobStatus(application)}>Job Status: {application.job_status}</p>

                                    {isEditStatus(application.edit_status) && (
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
                                            <option value='Accepted'>Accepted</option>
                                            <option
                                                value='Applied'
                                                disabled={interviewJobIds.includes(application.job_id)}
                                            >
                                                Applied
                                            </option>
                                            <option value='Declined'>Declined</option>
                                            <option value='Ghosted'>Ghosted</option>
                                            <option value='Interview'>Interview</option>
                                            <option value='Offer'>Offer</option>
                                            <option value='Rejected'>Rejected</option>
                                        </select>
                                    )}

                                    {isStatusInterview(application.job_status) && (
                                        <Link
                                            to={routes.addInterview}
                                            state={{
                                                app: application,
                                            }}
                                        >
                                            Click here to add an interview
                                        </Link>
                                    )}
                                    {showJobURL(application) && (
                                        <a
                                            className={styles.url}
                                            href={application.job_posting_url}
                                            target='_blank'
                                            rel='noreferrer'
                                        >
                                            Click here to head to job application URL
                                        </a>
                                    )}
                                </div>

                                <div className={styles.buttonGroup}>
                                    <PrimaryButton onClick={() => toggleEditStatus(application)}>
                                        {isEditStatus(application.edit_status) ? 'Save Changes' : 'Edit Status'}
                                    </PrimaryButton>

                                    <PrimaryButton onClick={() => handleDelete(application.job_id)}>
                                        Delete
                                    </PrimaryButton>

                                    {toggleArchived && (
                                        <PrimaryButton
                                            className={styles.archiveButton}
                                            onClick={() => handleArchive(application.job_id)}
                                            variant='success'
                                        >
                                            Archive
                                        </PrimaryButton>
                                    )}
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
                        <PrimaryButton onClick={() => navigate(routes.addApplication)}>
                            Add new application
                        </PrimaryButton>
                        {hasApplications(filteredApplications) && (
                            <>
                                <PrimaryButton onClick={() => handleDeleteAll()}>Delete all applications</PrimaryButton>
                                <PrimaryButton>
                                    <CSVLink
                                        data={data}
                                        headers={headers}
                                        filename={'job_applications.csv'}
                                        style={{ color: 'white' }}
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
