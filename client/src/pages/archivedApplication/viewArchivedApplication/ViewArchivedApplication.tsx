import { useEffect, useRef, useState } from 'react';
import type { ArchivedJobApplication } from '../models';
import { CSVLink } from 'react-csv';
import formatDate from '../../../helper/dateFormatter';
import { createApplicationCsvData } from '../../../helper/csvData';
import { createDeleteConfirmation } from '../../../helper/deleteConfirmation';
import {
    APPLICATION_CSV_HEADERS,
    JOB_STATUS_FILTER_OPTIONS,
    type JobStatus,
    type JobStatusFilter,
} from '../../jobApplication/models';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { scrollAndHighlight } from '../../../helper/highlightElement';
import ToggleButton from '../../../components/toggleButton/ToggleButton';
import styles from './ViewArchivedApplication.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../components/userPreferences/UserPreferencesProvider';
import { getErrorMessage } from '../../../helper/getErrorMessage';

const JOB_STATUS_CLASS_MAP: Record<JobStatus, string> = {
    Accepted: styles.accepted,
    Applied: styles.applied,
    Declined: styles.declined,
    Ghosted: styles.ghosted,
    Interview: styles.interview,
    Offer: styles.offer,
    Rejected: styles.rejected,
};

const ViewArchivedApplication = () => {
    const api = useJobTrackerAPI();
    const { preferences, updatePreferences } = useUserPreferences();
    const [archivedApplications, setArchivedApplications] = useState<ArchivedJobApplication[]>([]);
    const location = useLocation();
    const navigate = useNavigate();
    const showCorrespondingAppTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const confirm = useConfirm();
    const [isLoading, setIsLoading] = useState(true);
    const [isFilteringApplications, setIsFilteringApplications] = useState(false);
    const { showErrorToast } = useToast();
    const jobStatus = preferences.archived_application_job_status;
    const showNotes = preferences.archived_application_show_notes;

    const csvData = createApplicationCsvData(archivedApplications);

    const handleJobStatusChange = async (selectedStatus: JobStatusFilter) => {
        setIsFilteringApplications(true);

        try {
            const [, archivedApplications] = await Promise.all([
                updatePreferences({ archived_application_job_status: selectedStatus }),
                api.archivedApplication.listApplications({ jobStatus: selectedStatus }),
            ]);
            setArchivedApplications(Array.isArray(archivedApplications) ? archivedApplications : []);
        } catch (error) {
            showErrorToast(getErrorMessage(error));
        } finally {
            setIsFilteringApplications(false);
        }
    };

    useEffect(() => {
        let isActive = true;

        const fetchApplications = async () => {
            try {
                const fetchedApplications = await api.archivedApplication.listApplications({ jobStatus });
                if (isActive) {
                    setArchivedApplications(Array.isArray(fetchedApplications) ? fetchedApplications : []);
                }
            } catch (error) {
                showErrorToast(getErrorMessage(error));
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

            if (confirmed) {
                await api.archivedApplication.deleteApplication({ archivedJobId });
                setArchivedApplications((current) =>
                    current.filter((application) => application.archived_job_id !== archivedJobId)
                );
            }
        } catch (error) {
            showErrorToast(getErrorMessage(error));
        }
    };

    const handleDeleteAll = async () => {
        try {
            const { confirmed } = await confirm(createDeleteConfirmation('archived job application', true));

            if (confirmed) {
                await api.archivedApplication.deleteAllApplications();
                setArchivedApplications([]);
            }
        } catch (error) {
            showErrorToast(getErrorMessage(error));
        }
    };

    const handleUnarchive = async (archivedJobId: number) => {
        try {
            await api.archivedApplication.unarchiveApplication({ archivedJobId });
            setArchivedApplications((current) =>
                current.filter((application) => application.archived_job_id !== archivedJobId)
            );
        } catch (error) {
            showErrorToast('Failed to archive an application ' + getErrorMessage(error));
        }
    };

    const hasApplications = archivedApplications.length > 0;

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
                                {JOB_STATUS_FILTER_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {hasApplications && (
                            <ToggleButton
                                toggled={showNotes}
                                onToggle={() => void updatePreferences({ archived_application_show_notes: !showNotes })}
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

                    {archivedApplications.map((application, index) => (
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
                                <p className={JOB_STATUS_CLASS_MAP[application.job_status]}>
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
                            {showNotes && (
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
                                        data={csvData}
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
