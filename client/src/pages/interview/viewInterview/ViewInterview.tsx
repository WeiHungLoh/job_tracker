import { Link, useNavigate } from 'react-router-dom';
import { type MouseEvent, useEffect, useState } from 'react';
import formatDate from '../../../helper/dateFormatter';
import { createInterviewCsvData } from '../../../helper/csvData';
import { createDeleteConfirmation } from '../../../helper/deleteConfirmation';
import { getApplicationUnavailableMessage } from '../../../helper/applicationUnavailableMessage';
import { INTERVIEW_CSV_HEADERS, type JobInterview } from '../models';
import SkeletonCard from '../../../components/skeletonCard/SkeletonCard';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { routes } from '../../../routes';
import styles from './ViewInterview.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useToast } from '../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../components/userPreferences/UserPreferencesProvider';
import { getErrorToastMessage } from '../../../helper/getErrorToastMessage';
import CsvExportButton from '../../../components/csvExportButton/CsvExportButton';
import usePendingIds from '../../../hooks/usePendingIds';

const ViewInterview = () => {
    const api = useJobTrackerAPI();
    const { preferences } = useUserPreferences();
    const [interviews, setInterviews] = useState<JobInterview[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const {
        pendingIds: deletingInterviewIds,
        startPending: startDeletingInterview,
        stopPending: stopDeletingInterview,
    } = usePendingIds();
    const confirm = useConfirm();
    const navigate = useNavigate();
    const { showErrorToast } = useToast();

    useEffect(() => {
        let isActive = true;

        const fetchInterviews = async () => {
            try {
                const fetchedInterviews = await api.interview.listInterviews();
                if (isActive) {
                    setInterviews(Array.isArray(fetchedInterviews) ? fetchedInterviews : []);
                }
            } catch (error) {
                showErrorToast(getErrorToastMessage(error, 'Unable to load interviews. Please try again.'));
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        void fetchInterviews();
        return () => {
            isActive = false;
        };
    }, []);

    const csvData = createInterviewCsvData(interviews);

    const handleDelete = async (interviewId: number) => {
        try {
            const { confirmed } = await confirm(createDeleteConfirmation('job interview'));

            if (!confirmed) {
                return;
            }

            startDeletingInterview(interviewId);
            try {
                await api.interview.deleteInterview({ interviewId });
                setInterviews((current) => current.filter((interview) => interview.interview_id !== interviewId));
            } finally {
                stopDeletingInterview(interviewId);
            }
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to delete the interview. Please try again.'));
        }
    };

    const handleDeleteAll = async () => {
        try {
            const { confirmed } = await confirm(createDeleteConfirmation('job interview', true));

            if (!confirmed) {
                return;
            }

            setIsDeletingAll(true);
            try {
                await api.interview.deleteAllInterviews();
                setInterviews([]);
            } finally {
                setIsDeletingAll(false);
            }
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to delete interviews. Please try again.'));
        }
    };

    const hasInterviews = interviews.length > 0;

    const handleViewApplicationClick = async (event: MouseEvent<HTMLAnchorElement>, interview: JobInterview) => {
        event.preventDefault();

        try {
            const applications = await api.application.listApplications({
                jobStatuses: preferences.application_job_statuses,
            });
            const applicationExists = applications.some((application) => application.job_id === interview.job_id);

            if (!applicationExists) {
                showErrorToast(
                    getApplicationUnavailableMessage(preferences.application_job_statuses, interview.job_status, {
                        applicationLabel: 'This job application',
                        applicationsPageLabel: 'active applications',
                        statusFilterLabel: 'job status filter',
                    })
                );
                return;
            }

            navigate(`${routes.viewApplications}#${interview.job_id}`);
        } catch (error) {
            showErrorToast(
                getErrorToastMessage(error, 'Unable to check the corresponding job application. Please try again.')
            );
        }
    };

    return (
        <div className={styles.interviewList}>
            {isLoading && (
                <>
                    <br />
                    <SkeletonCard variant='interview' />
                    <SkeletonCard variant='interview' />
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
                                    isLoading={deletingInterviewIds.has(interview.interview_id)}
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
                                <PrimaryButton
                                    isLoading={isDeletingAll}
                                    variant='destructive'
                                    onClick={() => handleDeleteAll()}
                                >
                                    Delete all interviews
                                </PrimaryButton>
                                <CsvExportButton
                                    data={csvData}
                                    headers={INTERVIEW_CSV_HEADERS}
                                    filename='job_interviews.csv'
                                />
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ViewInterview;
