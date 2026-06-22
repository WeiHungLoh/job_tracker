// Taken from: https://www.npmjs.com/package/react-csv
import { useEffect, useState } from 'react';
import type { ArchivedJobApplication } from '../models';
import { CSVLink } from 'react-csv';
import DateFormatter from '../../../helper/dateFormatter';
import type { JobStatus, JobStatusFilter } from '../../jobApplication/models';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import ToggleButton from '../../../components/toggleButton/ToggleButton';
import styles from './ViewArchivedApplication.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../../components/toast/ToastProvider';

const ViewArchivedApplication = () => {
    const api = useJobTrackerAPI();
    const [archivedApplications, setArchivedApplications] = useState<ArchivedJobApplication[]>([]);
    const location = useLocation();
    const confirm = useConfirm();
    const [jobStatus, setJobStatus] = useState<JobStatusFilter>('Show All');
    const [toggleNotes, setToggleNotes] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { showErrorToast } = useToast();

    const filteredApplications = archivedApplications.filter((app) => {
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

    useEffect(() => {
        let isActive = true;

        const fetchApplications = async () => {
            try {
                const data = await api.archivedApplication.listApplications({ jobStatus: 'Show All' });
                if (isActive) setArchivedApplications(Array.isArray(data) ? data : []);
            } catch (error) {
                showErrorToast((error as Error).message);
            } finally {
                if (isActive) setIsLoading(false);
            }
        };

        void fetchApplications();
        return () => {
            isActive = false;
        };
    }, []);

    const handleJobStatusChange = async (selectedStatus: JobStatusFilter) => {
        setJobStatus(selectedStatus);

        try {
            const data = await api.archivedApplication.listApplications({ jobStatus: selectedStatus });
            setArchivedApplications(Array.isArray(data) ? data : []);
        } catch (error) {
            showErrorToast((error as Error).message);
        }
    };

    useEffect(() => {
        // Obtains application.job_id from <Link> in AddInterview
        const hash = location.hash;
        if (hash) {
            setTimeout(() => {
                // Ignores the first string character # to get job_id
                const app = document.getElementById(hash.substring(1));
                if (app) {
                    app.scrollIntoView({ behavior: 'smooth' });

                    // Add the 'highlighted' class when the application scrolls into view,
                    // and remove it after 4 seconds to match transition time
                    app.classList.add(styles.highlighted);
                    setTimeout(() => {
                        app.classList.remove(styles.highlighted);
                    }, 4000);
                }
            }, 100);
        }
    }, [location]);

    const handleDelete = async (archivedApplicationId: number) => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description:
                    'Are you sure you want to delete this archived job application? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true },
            });

            if (confirmed) {
                await api.archivedApplication.deleteApplication({ archivedApplicationId });
                setArchivedApplications((current) =>
                    current.filter((application) => application.archived_job_id !== archivedApplicationId)
                );
            }
        } catch (error) {
            showErrorToast((error as Error).message);
        }
    };

    const handleDeleteAll = async () => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description:
                    'Are you sure you want to delete all archived job applications? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            });

            if (confirmed) {
                await api.archivedApplication.deleteAllApplications();
                setArchivedApplications([]);
            }
        } catch (error) {
            showErrorToast((error as Error).message);
        }
    };

    const handleUnarchive = async (archivedJobId: number) => {
        try {
            await api.archivedApplication.unarchiveApplication({ archivedJobId });
            setArchivedApplications((current) =>
                current.filter((application) => application.archived_job_id !== archivedJobId)
            );
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

    const hasApplications = filteredApplications.length !== 0;

    return (
        <div className={styles.archivedApplicationList}>
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
                                role='listbox'
                                value={jobStatus}
                                onChange={(event) => void handleJobStatusChange(event.target.value as JobStatusFilter)}
                            >
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

                        {hasApplications && (
                            <ToggleButton
                                toggled={toggleNotes}
                                onToggle={() => setToggleNotes(!toggleNotes)}
                                label='Unhide Notes'
                                toggledLabel='Hide Notes'
                                color='yellow'
                            />
                        )}
                    </div>

                    {!hasApplications && (
                        <div>
                            <br />
                            No archived job application with that job status found. Start archiving now!{' '}
                        </div>
                    )}

                    {filteredApplications &&
                        filteredApplications.map((application, index) => (
                            <div
                                className={styles.application}
                                key={application.archived_job_id}
                                id={String(application.archived_job_id)}
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
                                        Application Date: {DateFormatter(application.application_date).formattedDate}
                                    </p>
                                    <p>
                                        Time since application:{' '}
                                        {DateFormatter(application.application_date).timeSinceApplication}
                                    </p>
                                    <p className={jobStatusClassMap[application.job_status]}>Job Status: {application.job_status}</p>

                                    {application.job_posting_url !== '' && (
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
                                    <div onClick={() => handleUnarchive(application.archived_job_id)}>
                                        <PrimaryButton variant='secondary'>Unarchive</PrimaryButton>
                                    </div>

                                    <PrimaryButton
                                        variant='destructive'
                                        onClick={() => handleDelete(application.archived_job_id)}
                                    >
                                        Delete
                                    </PrimaryButton>
                                </div>
                                {toggleNotes && (
                                    <div className={styles.notes}>
                                        <textarea
                                            value={
                                                !application.notes || application.notes.trim() === ''
                                                    ? 'You do not have any notes here'
                                                    : application.notes
                                            }
                                            disabled
                                        />
                                    </div>
                                )}
                            </div>
                        ))}

                    <div className={styles.applicationButton}>
                        {hasApplications && (
                            <>
                                <PrimaryButton variant='destructive' onClick={() => handleDeleteAll()}>
                                    Delete all archived applications
                                </PrimaryButton>
                                <PrimaryButton variant='secondary'>
                                    <CSVLink
                                        data={data}
                                        headers={headers}
                                        filename={'archived_job_applications.csv'}
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

export default ViewArchivedApplication;
