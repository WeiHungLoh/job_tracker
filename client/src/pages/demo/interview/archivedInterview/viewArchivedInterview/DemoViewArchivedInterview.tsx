import { type MouseEvent } from 'react';
import { createInterviewCsvData } from '../../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../../helper/deleteConfirmation';
import { getApplicationUnavailableMessage } from '../../../../../helper/applicationUnavailableMessage';
import { INTERVIEW_CSV_HEADERS, type ArchivedJobInterview } from '../../../../interview/models';
import { routes } from '../../../../../routes';
import styles from './DemoViewArchivedInterview.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useDemo } from '../../../context/DemoContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../../../components/userPreferences/UserPreferencesProvider';
import ActivityControls from '../../../../../components/activityControls/ActivityControls';
import DemoInterviewCard from '../../DemoInterviewCard';
import MoreOptions from '../../../../../components/activityControls/moreOptions/MoreOptions';
import EmptyState from '../../../../../components/emptyState/EmptyState';
import { createInterviewEmptyState } from '../../../../interview/interviewEmptyState';

const DemoViewArchivedInterview = () => {
    const { dispatch, state } = useDemo();
    const { preferences } = useUserPreferences();
    const confirm = useConfirm();
    const navigate = useNavigate();
    const { showErrorToast } = useToast();
    const csvData = createInterviewCsvData(state.archivedInterviews);
    const hasInterviews = state.archivedInterviews.length > 0;
    const emptyState = createInterviewEmptyState({
        activeInterviewsRoute: routes.demoViewInterviews,
        variant: 'archived',
    });

    const handleDelete = async (archivedInterviewId: number) => {
        const { confirmed } = await confirm(createDeleteConfirmation('archived job interview'));

        if (!confirmed) {
            return;
        }

        dispatch({ type: 'DELETE_ARCHIVED_INTERVIEW', payload: { archivedInterviewId } });
    };

    const handleDeleteAll = async () => {
        const { confirmed } = await confirm(createDeleteConfirmation('archived job interview', true));

        if (!confirmed) {
            return;
        }

        dispatch({ type: 'DELETE_ALL_ARCHIVED_INTERVIEWS' });
    };

    const handleViewApplicationClick = (event: MouseEvent<HTMLAnchorElement>, interview: ArchivedJobInterview) => {
        event.preventDefault();

        const applicationExists = state.archivedApplications.some(
            (application) =>
                application.archived_job_id === interview.archived_job_id &&
                preferences.archived_application_job_statuses.includes(application.job_status)
        );

        if (!applicationExists) {
            showErrorToast(
                getApplicationUnavailableMessage(preferences.archived_application_job_statuses, interview.job_status, {
                    applicationLabel: 'This archived job application',
                    applicationsPageLabel: 'archived applications',
                    statusFilterLabel: 'archived job status filter',
                })
            );
            return;
        }

        navigate(`${routes.demoArchivedApplications}#${interview.archived_job_id}`);
    };

    return (
        <div className={styles.archivedInterviewList}>
            {hasInterviews && (
                <ActivityControls>
                    <MoreOptions
                        csvData={csvData}
                        csvFilename='demo_archived_job_interviews.csv'
                        csvHeaders={INTERVIEW_CSV_HEADERS}
                        deleteLabel='Delete all archived interviews'
                        id='demo-archived-interview-more-options'
                        isDeleting={false}
                        onDelete={() => void handleDeleteAll()}
                    />
                </ActivityControls>
            )}
            {!hasInterviews && <EmptyState {...emptyState} />}

            {state.archivedInterviews.map((interview, index) => (
                <DemoInterviewCard
                    index={index}
                    interview={interview}
                    isDeleting={false}
                    key={interview.archived_interview_id}
                    onDelete={() => handleDelete(interview.archived_interview_id)}
                    onViewApplicationClick={(event) => handleViewApplicationClick(event, interview)}
                    variant='archived'
                />
            ))}
        </div>
    );
};

export default DemoViewArchivedInterview;
