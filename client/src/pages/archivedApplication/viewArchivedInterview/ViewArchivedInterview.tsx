// Taken from: https://www.npmjs.com/package/react-csv
import { useEffect, useState } from 'react';
import type { ArchivedJobInterview } from '../models';
import { CSVLink } from 'react-csv';
import DateFormatter from '../../../helper/dateFormatter';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { routes } from '../../../routes';
import styles from './ViewArchivedInterview.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useToast } from '../../../components/toast/ToastProvider';

const ViewArchivedInterview = () => {
    const api = useJobTrackerAPI();
    const [archivedInterviews, setArchivedInterviews] = useState<ArchivedJobInterview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const confirm = useConfirm();
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
        interview_date: DateFormatter(interview.interview_date).formattedDate,
        interview_type: interview.interview_type ? interview.interview_type : 'N/A',
        notes: interview.notes ? interview.notes : 'N/A',
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
                                    Interview Date: {DateFormatter(interview.interview_date).formattedDate}
                                </p>
                                <p>Time left: {DateFormatter(interview.interview_date).timeBeforeInterview}</p>
                                <Link to={`${routes.archivedApplications}#${interview.archived_job_id}`}>
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
