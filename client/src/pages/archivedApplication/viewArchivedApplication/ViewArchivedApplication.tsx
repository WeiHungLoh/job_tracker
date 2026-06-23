// Taken from: https://www.npmjs.com/package/react-csv
import { useEffect, useRef, useState } from 'react';
import type { ArchivedJobApplication } from '../models';
import { CSVLink } from 'react-csv';
import formatDate from '../../../helper/dateFormatter';
import { APPLICATION_CSV_HEADERS } from '../../jobApplication/models';
import type { JobStatus, JobStatusFilter } from '../../jobApplication/models';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { scrollAndHighlight } from '../../../helper/highlightElement';
import ToggleButton from '../../../components/toggleButton/ToggleButton';
import styles from './ViewArchivedApplication.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../components/userPreferences/UserPreferencesProvider';

const ViewArchivedApplication = () => {
    const api = useJobTrackerAPI();
    const { preferences, updatePreferences } = useUserPreferences();
    const [archivedApplications, setArchivedApplications] = useState<ArchivedJobApplication[]>([]);
    const location = useLocation();
    const showCorrespondingAppTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const confirm = useConfirm();
    const [isLoading, setIsLoading] = useState(true);
    const [isFilteringApplications, setIsFilteringApplications] = useState(false);
    const { showErrorToast } = useToast();
    const jobStatus = preferences.archived_application_job_status;
    const toggleNotes = preferences.archived_application_show_notes;

    const data = archivedApplications.map((app) => ({
        ...app,
        application_date: formatDate(app.application_date).formattedDate,
        job_location: app.job_location ? app.job_location : 'N/A',
        job_posting_url: app.job_posting_url ? app.job_posting_url : 'N/A',
        notes: app.notes ? app.notes : 'N/A',
    }));

    const handleJobStatusChange = async (selectedStatus: JobStatusFilter) => {
        setIsFilteringApplications(true);

        try {
            const [, data] = await Promise.all([
                updatePreferences({ archived_application_job_status: selectedStatus }),
                api.archivedApplication.listApplications({ jobStatus: selectedStatus }),
            ]);
            setArchivedApplications(Array.isArray(data) ? data : []);
        } catch (error) {
            showErrorToast((error as Error).message);
        } finally {
            setIsFilteringApplications(false);
        }
    };

    useEffect(() => {
        let isActive = true;

        const fetchApplications = async () => {
            try {
                const data = await api.archivedApplication.listApplications({ jobStatus });
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
    }, [archivedApplications, isLoading, location.hash]);

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

    const hasApplications = archivedApplications.length !== 0;

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
                                disabled={isFilteringApplications}
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
                                onToggle={() =>
                                    void updatePreferences({ archived_application_show_notes: !toggleNotes })
                                }
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
                            No archived job application with that job status found. Start archiving now!{' '}
                        </div>
                    )}

                    {archivedApplications &&
                        archivedApplications.map((application, index) => (
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
                                        Application Date: {formatDate(application.application_date).formattedDate}
                                    </p>
                                    <p>
                                        Time since application:{' '}
                                        {formatDate(application.application_date).timeSinceApplication}
                                    </p>
                                    <p className={jobStatusClassMap[application.job_status]}>
                                        Job Status: {application.job_status}
                                    </p>

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
                                    <PrimaryButton
                                        variant='secondary'
                                        onClick={() => handleUnarchive(application.archived_job_id)}
                                    >
                                        Unarchive
                                    </PrimaryButton>

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
                                        headers={APPLICATION_CSV_HEADERS}
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
