import { type MouseEvent, useRef, useState } from 'react';
import { createInterviewCsvData } from '../../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../../helper/deleteConfirmation';
import { createDeleteAllInterviewsConfirmation } from '../../../../../helper/bulkConfirmation';
import {
    ACTIVE_APPLICATION_BOARD_MESSAGE,
    getApplicationUnavailableMessage,
} from '../../../../../helper/applicationUnavailableMessage';
import { INTERVIEW_CSV_HEADERS, type JobInterview } from '../../../../interview/models';
import { routes } from '../../../../../routes';
import styles from '../../../../interview/InterviewListPage.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useDemo } from '../../../context/DemoContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../../../components/userPreferences/UserPreferencesProvider';
import ActivityControls from '../../../../../components/activityControls/ActivityControls';
import InterviewCard from '../../../../interview/InterviewCard';
import MoreOptions from '../../../../../components/activityControls/moreOptions/MoreOptions';
import EmptyState from '../../../../../components/emptyState/EmptyState';
import { createInterviewEmptyState } from '../../../../interview/interviewEmptyState';
import ApplicationViewToggle from '../../../../../components/activityControls/applicationViewToggle/ApplicationViewToggle';
import InterviewGrid from '../../../../interview/interviewGrid/InterviewGrid';

const DemoViewInterview = () => {
    const { dispatch, state, updatePreferences } = useDemo();
    const { preferences } = useUserPreferences();
    const confirm = useConfirm();
    const navigate = useNavigate();
    const { showErrorToast } = useToast();
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const deleteAllPendingRef = useRef(false);
    const csvData = createInterviewCsvData(state.interviews);
    const hasInterviews = state.interviews.length > 0;
    const emptyState = createInterviewEmptyState({
        applicationsRoute: routes.demoViewApplications,
        variant: 'active',
    });
    const viewMode = preferences.interview_view_mode;
    const isBoardView = viewMode === 'board';

    const handleDelete = async (interviewId: number) => {
        const { confirmed } = await confirm(createDeleteConfirmation('job interview'));

        if (!confirmed) {
            return;
        }

        dispatch({ type: 'DELETE_INTERVIEW', payload: { interviewId } });
    };

    const handleDeleteAll = async () => {
        if (deleteAllPendingRef.current) {
            return;
        }

        deleteAllPendingRef.current = true;
        setIsDeletingAll(true);

        try {
            if (state.interviews.length === 0) {
                return;
            }

            const { confirmed } = await confirm(
                createDeleteAllInterviewsConfirmation(state.interviews.length, 'active')
            );

            if (!confirmed) {
                return;
            }

            dispatch({ type: 'DELETE_ALL_INTERVIEWS' });
        } finally {
            deleteAllPendingRef.current = false;
            setIsDeletingAll(false);
        }
    };

    const handleViewApplicationClick = (event: MouseEvent<HTMLAnchorElement>, interview: JobInterview) => {
        event.preventDefault();

        if (preferences.application_view_mode === 'board') {
            showErrorToast(ACTIVE_APPLICATION_BOARD_MESSAGE);
            return;
        }

        const applicationExists = state.applications.some(
            (application) =>
                application.job_id === interview.job_id &&
                preferences.application_job_statuses.includes(application.job_status)
        );

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

        navigate(`${routes.demoViewApplications}#${interview.job_id}`);
    };

    return (
        <div className={`${styles.interviewList} ${isBoardView ? styles.boardLayout : ''}`}>
            <div className={styles.controlsRow}>
                <ActivityControls
                    actions={
                        hasInterviews ? (
                            <MoreOptions
                                csvData={csvData}
                                csvFilename='demo_job_interviews.csv'
                                csvHeaders={INTERVIEW_CSV_HEADERS}
                                deleteLabel='Delete all interviews'
                                id='demo-interview-more-options'
                                isDeleting={isDeletingAll}
                                onDelete={() => void handleDeleteAll()}
                            />
                        ) : undefined
                    }
                    ariaLabel='Demo interview view and management controls'
                >
                    <ApplicationViewToggle
                        ariaLabel='Interview view'
                        currentView={viewMode}
                        onViewChange={(nextViewMode) => void updatePreferences({ interview_view_mode: nextViewMode })}
                    />
                </ActivityControls>
            </div>
            {!hasInterviews && <EmptyState {...emptyState} />}

            {hasInterviews && (
                <InterviewGrid ariaLabel='Active interviews' layout={viewMode}>
                    {state.interviews.map((interview, index) => (
                        <InterviewCard
                            applicationRoute={routes.demoViewApplications}
                            index={index}
                            interview={interview}
                            isDeleting={false}
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

export default DemoViewInterview;
