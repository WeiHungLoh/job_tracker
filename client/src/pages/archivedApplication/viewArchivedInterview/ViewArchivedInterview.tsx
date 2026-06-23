// Taken from: https://www.npmjs.com/package/react-csv
import { type MouseEvent, useEffect, useState } from 'react';
import type { ArchivedJobInterview } from '../models';
import { CSVLink } from 'react-csv';
import formatDate from '../../../helper/dateFormatter';
import { getApplicationUnavailableMessage } from '../../../helper/applicationUnavailableMessage';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { routes } from '../../../routes';
import styles from './ViewArchivedInterview.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useToast } from '../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../components/userPreferences/UserPreferencesProvider';

const ViewArchivedInterview = () => {
    const api = useJobTrackerAPI();
    const { preferences } = useUserPreferences();
    const [archivedInterviews, setArchivedInterviews] = useState<ArchivedJobInterview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const confirm = useConfirm();
    const navigate = useNavigate();
    const { showErrorToast } = useToast();

    useEffect(() => {
        let isActive = true;

        const fetchInterviews = async () => {
            try {
                const data = await api.archivedInterview.listInterviews();
                if (isActive) setArchivedInterviews(Array.isArray(data) ? data : []);
            } catch (error) {
                showErrorToast((error as Error).message);
            } finally {
                if (isActive) setIsLoading(false);
            }
        };

        void fetchInterviews();
        return () => {
            isActive = false;
        };
    }, []);

    const headers = [
        { label: 'Company', key: 'company_name' },
        { label: 'Job Title', key: 'job_title' },
        { label: 'Location', key: 'interview_location' },
        { label: 'Interview Date', key: 'interview_date' },
        { label: 'Interview Type', key: 'interview_type' },
        { label: 'Additional Notes', key: 'notes' },
    ];

    const data = archivedInterviews.map((interview) => ({
        ...interview,
        interview_date: formatDate(interview.interview_date).formattedDate,
        interview_type: interview.interview_type ? interview.interview_type : 'N/A',
        notes: interview.interview_notes ? interview.interview_notes : 'N/A',
    }));

    const handleDelete = async (interviewId: number) => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description:
                    'Are you sure you want to delete this archived job interview? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true },
            });

            if (confirmed) {
                await api.archivedInterview.deleteInterview({ interviewId });
                setArchivedInterviews((current) =>
                    current.filter((interview) => interview.archived_interview_id !== interviewId)
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
                    'Are you sure you want to delete all archived job interviews? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            });

            if (confirmed) {
                await api.archivedInterview.deleteAllInterviews();
                setArchivedInterviews([]);
            }
        } catch (error) {
            showErrorToast((error as Error).message);
        }
    };

    const hasInterviews = archivedInterviews.length !== 0;

    const handleViewApplicationClick = async (
        event: MouseEvent<HTMLAnchorElement>,
        interview: ArchivedJobInterview
    ) => {
        event.preventDefault();

        try {
            const applications = await api.archivedApplication.listApplications({
                jobStatus: preferences.archived_application_job_status,
            });
            const applicationExists = applications.some(
                (application) => application.archived_job_id === interview.archived_job_id
            );

            if (!applicationExists) {
                showErrorToast(
                    getApplicationUnavailableMessage(
                        preferences.archived_application_job_status,
                        interview.job_status,
                        {
                            applicationLabel: 'This archived job application',
                            applicationsPageLabel: 'archived applications',
                            statusFilterLabel: 'archived job status filter',
                        }
                    )
                );
                return;
            }

            navigate(`${routes.archivedApplications}#${interview.archived_job_id}`);
        } catch (error) {
            showErrorToast((error as Error).message);
            return;
        }
    };

    return (
        <div className={styles.archivedInterviewList}>
            {isLoading && (
                <>
                    <br />
                    <LoadingSpinner />
                </>
            )}

            {!isLoading && (
                <>
                    {!hasInterviews && (
                        <div>
                            <br />
                            No archived job interview found. Start archiving now!{' '}
                        </div>
                    )}
                    <br />
                    {archivedInterviews.map((interview, index) => (
                        <div className={styles.interview} key={interview.archived_interview_id}>
                            <div className={styles.interviewContent}>
                                <h2>
                                    {index + 1}. {interview.company_name}
                                </h2>
                                <p>Job Title: {interview.job_title}</p>
                                <p className={styles.location}>Location: {interview.interview_location}</p>
                                {interview.interview_type !== '' && (
                                    <p className={styles.type}>Interview Type: {interview.interview_type}</p>
                                )}
                                {interview.interview_notes !== '' && (
                                    <p className={styles.notes}>Notes: {interview.interview_notes}</p>
                                )}
                                <p className={styles.date}>
                                    Interview Date: {formatDate(interview.interview_date).formattedDate}
                                </p>
                                <p>Time left: {formatDate(interview.interview_date).timeBeforeInterview}</p>
                                <Link
                                    to={`${routes.archivedApplications}#${interview.archived_job_id}`}
                                    onClick={(event) => void handleViewApplicationClick(event, interview)}
                                >
                                    Click here to review corresponding job application
                                </Link>
                            </div>

                            <div className={styles.buttonGroup}>
                                <PrimaryButton
                                    variant='destructive'
                                    onClick={() => handleDelete(interview.archived_interview_id)}
                                >
                                    Delete
                                </PrimaryButton>
                            </div>
                        </div>
                    ))}

                    <div className={styles.interviewButton}>
                        {hasInterviews && (
                            <>
                                <PrimaryButton variant='destructive' onClick={() => handleDeleteAll()}>
                                    Delete all archived interviews
                                </PrimaryButton>
                                <PrimaryButton variant='secondary'>
                                    <CSVLink
                                        data={data}
                                        headers={headers}
                                        filename='archived_job_interviews.csv'
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

export default ViewArchivedInterview;
