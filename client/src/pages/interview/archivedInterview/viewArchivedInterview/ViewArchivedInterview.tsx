import { type MouseEvent, useEffect, useRef, useState } from 'react';
import type { ArchivedJobInterview } from '../../models';
import { createInterviewCsvData } from '../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../helper/deleteConfirmation';
import { createDeleteAllInterviewsConfirmation } from '../../../../helper/bulkConfirmation';
import {
    ARCHIVED_APPLICATION_BOARD_MESSAGE,
    getApplicationUnavailableMessage,
} from '../../../../helper/applicationUnavailableMessage';
import { INTERVIEW_CSV_HEADERS } from '../../models';
import { useNavigate } from 'react-router-dom';
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

const ViewArchivedInterview = () => {
    const api = useJobTrackerAPI();
    const { preferences, updatePreferences } = useUserPreferences();
    const [archivedInterviews, setArchivedInterviews] = useState<ArchivedJobInterview[]>([]);
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
    const viewMode = preferences.archived_interview_view_mode;
    const isBoardView = viewMode === 'board';

    const handleViewModeChange = async (nextViewMode: ApplicationViewMode) => {
        try {
            await updatePreferences({ archived_interview_view_mode: nextViewMode });
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to save display preferences. Please try again.'));
        }
    };

    useEffect(() => {
        let isActive = true;

        const fetchInterviews = async () => {
            try {
                const fetchedInterviews = await api.archivedInterview.listInterviews();
                if (isActive) {
                    setArchivedInterviews(Array.isArray(fetchedInterviews) ? fetchedInterviews : []);
                }
            } catch (error) {
                showErrorToast(getErrorToastMessage(error, 'Unable to load archived interviews. Please try again.'));
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

    const csvData = createInterviewCsvData(archivedInterviews);

    const handleDelete = async (archivedInterviewId: number) => {
        try {
            const { confirmed } = await confirm(createDeleteConfirmation('archived job interview'));

            if (!confirmed) {
                return;
            }

            startDeletingInterview(archivedInterviewId);
            try {
                await api.archivedInterview.deleteInterview({ archivedInterviewId });
                setArchivedInterviews((current) =>
                    current.filter((interview) => interview.archived_interview_id !== archivedInterviewId)
                );
            } finally {
                stopDeletingInterview(archivedInterviewId);
            }
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to delete the archived interview. Please try again.'));
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
            const summary = await api.archivedInterview.getSummary();
            countsLoaded = true;

            if (summary.interview_count === 0) {
                setArchivedInterviews([]);
                return;
            }

            const { confirmed } = await confirm(
                createDeleteAllInterviewsConfirmation(summary.interview_count, 'archived')
            );

            if (!confirmed) {
                return;
            }

            await api.archivedInterview.deleteAllInterviews();
            setArchivedInterviews([]);
        } catch (error) {
            showErrorToast(
                getErrorToastMessage(
                    error,
                    countsLoaded
                        ? 'Unable to delete archived interviews. Please try again.'
                        : 'Unable to load archived interview counts. Please try again.'
                )
            );
        } finally {
            deleteAllPendingRef.current = false;
            setIsDeletingAll(false);
        }
    };

    const hasInterviews = archivedInterviews.length > 0;
    const emptyState = createInterviewEmptyState({
        activeInterviewsRoute: routes.viewInterviews,
        variant: 'archived',
    });

    const handleViewApplicationClick = async (
        event: MouseEvent<HTMLAnchorElement>,
        interview: ArchivedJobInterview
    ) => {
        event.preventDefault();

        if (preferences.archived_application_view_mode === 'board') {
            showErrorToast(ARCHIVED_APPLICATION_BOARD_MESSAGE);
            return;
        }

        try {
            const applications = await api.archivedApplication.listApplications({
                jobStatuses: preferences.archived_application_job_statuses,
            });
            const applicationExists = applications.some(
                (application) => application.archived_job_id === interview.archived_job_id
            );

            if (!applicationExists) {
                showErrorToast(
                    getApplicationUnavailableMessage(
                        preferences.archived_application_job_statuses,
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
            showErrorToast(
                getErrorToastMessage(
                    error,
                    'Unable to check the corresponding archived job application. Please try again.'
                )
            );
        }
    };

    return (
        <div className={`${styles.interviewList} ${isBoardView ? styles.boardLayout : ''}`}>
            <div className={styles.controlsRow}>
                <ActivityControls
                    actions={
                        !isLoading && hasInterviews ? (
                            <MoreOptions
                                csvData={csvData}
                                csvFilename='archived_job_interviews.csv'
                                csvHeaders={INTERVIEW_CSV_HEADERS}
                                deleteLabel='Delete all archived interviews'
                                id='archived-interview-more-options'
                                isDeleting={isDeletingAll}
                                onDelete={() => void handleDeleteAll()}
                            />
                        ) : undefined
                    }
                    ariaLabel='Archived interview view and management controls'
                    mobileLayout='inlineWhenPossible'
                >
                    <ApplicationViewToggle
                        ariaLabel='Archived interview view'
                        currentView={viewMode}
                        onViewChange={(nextViewMode) => void handleViewModeChange(nextViewMode)}
                    />
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
                <InterviewGrid ariaLabel='Archived interviews' layout={viewMode}>
                    {archivedInterviews.map((interview, index) => (
                        <InterviewCard
                            applicationRoute={routes.archivedApplications}
                            index={index}
                            interview={interview}
                            isDeleting={deletingInterviewIds.has(interview.archived_interview_id)}
                            key={interview.archived_interview_id}
                            layout={viewMode}
                            onDelete={() => handleDelete(interview.archived_interview_id)}
                            onViewApplicationClick={(event) => handleViewApplicationClick(event, interview)}
                            variant='archived'
                        />
                    ))}
                </InterviewGrid>
            )}
        </div>
    );
};

export default ViewArchivedInterview;
