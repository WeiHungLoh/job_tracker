import { Link, useNavigate } from 'react-router-dom';
import { type MouseEvent, useEffect, useState } from 'react';
import { CSVLink } from 'react-csv';
import formatDate from '../../../helper/dateFormatter';
import { getApplicationUnavailableMessage } from '../../../helper/applicationUnavailableMessage';
import { INTERVIEW_CSV_HEADERS, type JobInterview } from '../models';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
// Taken from: https://www.npmjs.com/package/react-csv
import { routes } from '../../../routes';
import styles from './ViewInterview.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useToast } from '../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../components/userPreferences/UserPreferencesProvider';

const ViewInterview = () => {
    const api = useJobTrackerAPI();
    const { preferences } = useUserPreferences();
    const [interviews, setInterviews] = useState<JobInterview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const confirm = useConfirm();
    const navigate = useNavigate();
    const { showErrorToast } = useToast();

    useEffect(() => {
        let isActive = true;

        const fetchInterviews = async () => {
            try {
                const data = await api.interview.listInterviews();
                if (isActive) setInterviews(Array.isArray(data) ? data : []);
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

    const data = interviews.map((interview) => ({
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
                    'Are you sure you want to delete this job interview? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                confirmationButtonProps: { autoFocus: true },
            });

            if (confirmed) {
                await api.interview.deleteInterview({ interviewId });
                setInterviews((current) => current.filter((interview) => interview.interview_id !== interviewId));
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
                    'Are you sure you want to delete all job interviews? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            });

            if (confirmed) {
                await api.interview.deleteAllInterviews();
                setInterviews([]);
            }
        } catch (error) {
            showErrorToast((error as Error).message);
        }
    };

    const hasInterviews = interviews.length !== 0;

    const handleViewApplicationClick = async (event: MouseEvent<HTMLAnchorElement>, interview: JobInterview) => {
        event.preventDefault();

        try {
            const applications = await api.application.listApplications({
                jobStatus: preferences.application_job_status,
            });
            const applicationExists = applications.some((application) => application.job_id === interview.job_id);

            if (!applicationExists) {
                showErrorToast(
                    getApplicationUnavailableMessage(preferences.application_job_status, interview.job_status, {
                        applicationLabel: 'This job application',
                        applicationsPageLabel: 'active applications',
                        statusFilterLabel: 'job status filter',
                    })
                );
                return;
            }

            navigate(`${routes.viewApplications}#${interview.job_id}`);
        } catch (error) {
            showErrorToast((error as Error).message);
            return;
        }
    };

    return (
        <div className={styles.interviewList}>
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
                            No job interview found. Start adding one now!{' '}
                        </div>
                    )}
                    <br />
                    {interviews.map((interview, index) => (
                        <div className={styles.interview} key={interview.interview_id}>
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
                                    to={`${routes.viewApplications}#${interview.job_id}`}
                                    onClick={(event) => void handleViewApplicationClick(event, interview)}
                                >
                                    Click here to review corresponding job application
                                </Link>
                            </div>

                            <div className={styles.buttonGroup}>
                                <PrimaryButton
                                    variant='destructive'
                                    onClick={() => handleDelete(interview.interview_id)}
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
                                    Delete all interviews
                                </PrimaryButton>
                                <PrimaryButton variant='secondary'>
                                    <CSVLink
                                        data={data}
                                        headers={INTERVIEW_CSV_HEADERS}
                                        filename='job_interviews.csv'
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

export default ViewInterview;
