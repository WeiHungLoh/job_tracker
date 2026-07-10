import { useNavigate } from 'react-router-dom';
import { type MouseEvent, useEffect, useState } from 'react';
import { createInterviewCsvData } from '../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../helper/deleteConfirmation';
import { getApplicationUnavailableMessage } from '../../../../helper/applicationUnavailableMessage';
import { INTERVIEW_CSV_HEADERS, type JobInterview } from '../../models';
import SkeletonCard from '../../../../components/skeletonLoader/skeletonCard/SkeletonCard';
import { routes } from '../../../../routes';
import styles from './ViewInterview.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../../api/useJobTrackerAPI';
import { useToast } from '../../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../../components/userPreferences/UserPreferencesProvider';
import { getErrorToastMessage } from '../../../../helper/getErrorToastMessage';
import usePendingIds from '../../../../hooks/usePendingIds';
import InterviewCard from '../../InterviewCard';
import ActivityControls from '../../../../components/activityControls/ActivityControls';
import MoreOptions from '../../../../components/activityControls/moreOptions/MoreOptions';
import EmptyState from '../../../../components/emptyState/EmptyState';
import { createInterviewEmptyState } from '../../interviewEmptyState';

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
    const emptyState = createInterviewEmptyState({
        applicationsRoute: routes.viewApplications,
        variant: 'active',
    });

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
                    {hasInterviews && (
                        <ActivityControls>
                            <MoreOptions
                                csvData={csvData}
                                csvFilename='job_interviews.csv'
                                csvHeaders={INTERVIEW_CSV_HEADERS}
                                deleteLabel='Delete all interviews'
                                id='interview-more-options'
                                isDeleting={isDeletingAll}
                                onDelete={() => void handleDeleteAll()}
                            />
                        </ActivityControls>
                    )}
                    {!hasInterviews && <EmptyState {...emptyState} />}

                    {interviews.map((interview, index) => (
                        <InterviewCard
                            index={index}
                            interview={interview}
                            isDeleting={deletingInterviewIds.has(interview.interview_id)}
                            key={interview.interview_id}
                            onDelete={() => handleDelete(interview.interview_id)}
                            onViewApplicationClick={(event) => handleViewApplicationClick(event, interview)}
                            variant='job'
                        />
                    ))}
                </>
            )}
        </div>
    );
};

export default ViewInterview;
