import { type MouseEvent } from 'react';
import { createInterviewCsvData } from '../../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../../helper/deleteConfirmation';
import { getApplicationUnavailableMessage } from '../../../../../helper/applicationUnavailableMessage';
import { INTERVIEW_CSV_HEADERS, type JobInterview } from '../../../../interview/models';
import { routes } from '../../../../../routes';
import styles from './DemoViewInterview.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useDemo } from '../../../context/DemoContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../../../components/userPreferences/UserPreferencesProvider';
import ActivityControls from '../../../../../components/activityControls/ActivityControls';
import DemoInterviewCard from '../../DemoInterviewCard';
import MoreOptions from '../../../../../components/activityControls/moreOptions/MoreOptions';

const DemoViewInterview = () => {
    const { dispatch, state } = useDemo();
    const { preferences } = useUserPreferences();
    const confirm = useConfirm();
    const navigate = useNavigate();
    const { showErrorToast } = useToast();
    const csvData = createInterviewCsvData(state.interviews);
    const hasInterviews = state.interviews.length > 0;

    const handleDelete = async (interviewId: number) => {
        const { confirmed } = await confirm(createDeleteConfirmation('job interview'));

        if (!confirmed) {
            return;
        }

        dispatch({ type: 'DELETE_INTERVIEW', payload: { interviewId } });
    };

    const handleDeleteAll = async () => {
        const { confirmed } = await confirm(createDeleteConfirmation('job interview', true));

        if (!confirmed) {
            return;
        }

        dispatch({ type: 'DELETE_ALL_INTERVIEWS' });
    };

    const handleViewApplicationClick = (event: MouseEvent<HTMLAnchorElement>, interview: JobInterview) => {
        event.preventDefault();

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
        <div className={styles.interviewList}>
            {hasInterviews && (
                <ActivityControls>
                    <MoreOptions
                        csvData={csvData}
                        csvFilename='demo_job_interviews.csv'
                        csvHeaders={INTERVIEW_CSV_HEADERS}
                        deleteLabel='Delete all interviews'
                        id='demo-interview-more-options'
                        isDeleting={false}
                        onDelete={() => void handleDeleteAll()}
                    />
                </ActivityControls>
            )}
            {!hasInterviews && (
                <div>
                    <br />
                    No job interview found. Start adding one now!{' '}
                </div>
            )}

            {state.interviews.map((interview, index) => (
                <DemoInterviewCard
                    index={index}
                    interview={interview}
                    isDeleting={false}
                    key={interview.interview_id}
                    onDelete={() => handleDelete(interview.interview_id)}
                    onViewApplicationClick={(event) => handleViewApplicationClick(event, interview)}
                    variant='job'
                />
            ))}
        </div>
    );
};

export default DemoViewInterview;
