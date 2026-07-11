import { useNavigate } from 'react-router-dom';
import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { createInterviewCsvData } from '../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../helper/deleteConfirmation';
import { createDeleteAllInterviewsConfirmation } from '../../../../helper/bulkConfirmation';
import {
    ACTIVE_APPLICATION_BOARD_MESSAGE,
    getApplicationUnavailableMessage,
} from '../../../../helper/applicationUnavailableMessage';
import { INTERVIEW_CSV_HEADERS, type JobInterview } from '../../models';
import SkeletonCard from '../../../../components/skeletonLoader/skeletonCard/SkeletonCard';
import { routes } from '../../../../routes';
import styles from '../../InterviewListPage.module.css';
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
import ApplicationViewToggle from '../../../../components/activityControls/applicationViewToggle/ApplicationViewToggle';
import type { ApplicationViewMode } from '../../../../components/activityControls/applicationViewToggle/models';
import SkeletonInterviewBoard from '../../../../components/skeletonLoader/skeletonInterviewBoard/SkeletonInterviewBoard';
import InterviewGrid from '../../interviewGrid/InterviewGrid';

const ViewInterview = () => {
    const api = useJobTrackerAPI();
    const { preferences, updatePreferences } = useUserPreferences();
    const [interviews, setInterviews] = useState<JobInterview[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const deleteAllPendingRef = useRef(false);
    const {
        pendingIds: deletingInterviewIds,
        startPending: startDeletingInterview,
        stopPending: stopDeletingInterview,
    } = usePendingIds();
    const confirm = useConfirm();
    const navigate = useNavigate();
    const { showErrorToast } = useToast();
    const viewMode = preferences.interview_view_mode;
    const isBoardView = viewMode === 'board';

    const handleViewModeChange = async (nextViewMode: ApplicationViewMode) => {
        try {
            await updatePreferences({ interview_view_mode: nextViewMode });
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to save display preferences. Please try again.'));
        }
    };

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
        if (deleteAllPendingRef.current) {
            return;
        }

        deleteAllPendingRef.current = true;
        setIsDeletingAll(true);
        let countsLoaded = false;

        try {
            const summary = await api.interview.getSummary();
            countsLoaded = true;

            if (summary.interview_count === 0) {
                setInterviews([]);
                return;
            }

            const { confirmed } = await confirm(
                createDeleteAllInterviewsConfirmation(summary.interview_count, 'active')
            );

            if (!confirmed) {
                return;
            }

            await api.interview.deleteAllInterviews();
            setInterviews([]);
        } catch (error) {
            showErrorToast(
                getErrorToastMessage(
                    error,
                    countsLoaded
                        ? 'Unable to delete interviews. Please try again.'
                        : 'Unable to load active interview counts. Please try again.'
                )
            );
        } finally {
            deleteAllPendingRef.current = false;
            setIsDeletingAll(false);
        }
    };

    const hasInterviews = interviews.length > 0;
    const emptyState = createInterviewEmptyState({
        applicationsRoute: routes.viewApplications,
        variant: 'active',
    });

    const handleViewApplicationClick = async (event: MouseEvent<HTMLAnchorElement>, interview: JobInterview) => {
        event.preventDefault();

        if (preferences.application_view_mode === 'board') {
            showErrorToast(ACTIVE_APPLICATION_BOARD_MESSAGE);
            return;
        }

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
        <div className={`${styles.interviewList} ${isBoardView ? styles.boardLayout : ''}`}>
            <div className={styles.controlsRow}>
                <ActivityControls>
                    <ApplicationViewToggle
                        ariaLabel='Interview view'
                        currentView={viewMode}
                        onViewChange={(nextViewMode) => void handleViewModeChange(nextViewMode)}
                    />
                    {!isLoading && hasInterviews && (
                        <MoreOptions
                            csvData={csvData}
                            csvFilename='job_interviews.csv'
                            csvHeaders={INTERVIEW_CSV_HEADERS}
                            deleteLabel='Delete all interviews'
                            id='interview-more-options'
                            isDeleting={isDeletingAll}
                            onDelete={() => void handleDeleteAll()}
                        />
                    )}
                </ActivityControls>
            </div>

            {isLoading &&
                (isBoardView ? (
                    <SkeletonInterviewBoard />
                ) : (
                    <>
                        <SkeletonCard variant='interview' />
                        <SkeletonCard variant='interview' />
                    </>
                ))}

            {!isLoading && !hasInterviews && <EmptyState {...emptyState} />}

            {!isLoading && hasInterviews && (
                <InterviewGrid ariaLabel='Active interviews' layout={viewMode}>
                    {interviews.map((interview, index) => (
                        <InterviewCard
                            applicationRoute={routes.viewApplications}
                            index={index}
                            interview={interview}
                            isDeleting={deletingInterviewIds.has(interview.interview_id)}
                            key={interview.interview_id}
                            layout={viewMode}
                            onDelete={() => handleDelete(interview.interview_id)}
                            onViewApplicationClick={(event) => handleViewApplicationClick(event, interview)}
                            variant='job'
                        />
                    ))}
                </InterviewGrid>
            )}
        </div>
    );
};

export default ViewInterview;
