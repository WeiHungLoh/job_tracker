import { type MouseEvent, useEffect, useState } from 'react';
import type { ArchivedJobInterview } from '../../models';
import { createInterviewCsvData } from '../../../../helper/csvData';
import { createDeleteConfirmation } from '../../../../helper/deleteConfirmation';
import { getApplicationUnavailableMessage } from '../../../../helper/applicationUnavailableMessage';
import { INTERVIEW_CSV_HEADERS } from '../../models';
import { useNavigate } from 'react-router-dom';
import SkeletonCard from '../../../../components/skeletonCard/SkeletonCard';
import PrimaryButton from '../../../../components/button/PrimaryButton';
import { routes } from '../../../../routes';
import styles from './ViewArchivedInterview.module.css';
import { useConfirm } from 'material-ui-confirm';
import { useJobTrackerAPI } from '../../../../api/useJobTrackerAPI';
import { useToast } from '../../../../components/toast/ToastProvider';
import { useUserPreferences } from '../../../../components/userPreferences/UserPreferencesProvider';
import { getErrorToastMessage } from '../../../../helper/getErrorToastMessage';
import CsvExportButton from '../../../../components/csvExportButton/CsvExportButton';
import usePendingIds from '../../../../hooks/usePendingIds';
import InterviewCard from '../../InterviewCard';

const ViewArchivedInterview = () => {
    const api = useJobTrackerAPI();
    const { preferences } = useUserPreferences();
    const [archivedInterviews, setArchivedInterviews] = useState<ArchivedJobInterview[]>([]);
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
        try {
            const { confirmed } = await confirm(createDeleteConfirmation('archived job interview', true));

            if (!confirmed) {
                return;
            }

            setIsDeletingAll(true);
            try {
                await api.archivedInterview.deleteAllInterviews();
                setArchivedInterviews([]);
            } finally {
                setIsDeletingAll(false);
            }
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to delete archived interviews. Please try again.'));
        }
    };

    const hasInterviews = archivedInterviews.length > 0;

    const handleViewApplicationClick = async (
        event: MouseEvent<HTMLAnchorElement>,
        interview: ArchivedJobInterview
    ) => {
        event.preventDefault();

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
        <div className={styles.archivedInterviewList}>
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
                            No archived job interview found. Start archiving now!{' '}
                        </div>
                    )}
                    <br />
                    {archivedInterviews.map((interview, index) => (
                        <InterviewCard
                            index={index}
                            interview={interview}
                            isDeleting={deletingInterviewIds.has(interview.archived_interview_id)}
                            key={interview.archived_interview_id}
                            onDelete={() => handleDelete(interview.archived_interview_id)}
                            onViewApplicationClick={(event) => handleViewApplicationClick(event, interview)}
                            variant='archived'
                        />
                    ))}

                    <div className={styles.interviewButton}>
                        {hasInterviews && (
                            <>
                                <PrimaryButton
                                    isLoading={isDeletingAll}
                                    variant='destructive'
                                    onClick={() => handleDeleteAll()}
                                >
                                    Delete all archived interviews
                                </PrimaryButton>
                                <CsvExportButton
                                    data={csvData}
                                    headers={INTERVIEW_CSV_HEADERS}
                                    filename='archived_job_interviews.csv'
                                />
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ViewArchivedInterview;
