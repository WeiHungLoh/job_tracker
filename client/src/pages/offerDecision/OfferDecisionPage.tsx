import { useEffect, useRef, useState } from 'react';
import EmptyState from '../../components/emptyState/EmptyState';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import OfferDecisionWorkspace from './OfferDecisionWorkspace';
import type { OfferDecisionWorkspaceData, SaveOfferEvaluationRequest } from './models';
import { getErrorToastMessage } from '../../helper/getErrorToastMessage';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useToast } from '../../components/toast/ToastProvider';
import styles from './OfferDecisionWorkspace.module.css';

type OfferDecisionPageProps = {
    archived: boolean;
};

const OfferDecisionPage = ({ archived }: OfferDecisionPageProps) => {
    const [data, setData] = useState<OfferDecisionWorkspaceData>();
    const [isLoading, setIsLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const requestIdRef = useRef(0);
    const api = useJobTrackerAPI();
    const { showErrorToast, showSuccessToast } = useToast();

    const loadWorkspace = async () => {
        const requestId = ++requestIdRef.current;
        setIsLoading(true);
        setLoadFailed(false);

        try {
            const workspace = archived ? await api.offerDecision.getArchived() : await api.offerDecision.getActive();
            if (requestId === requestIdRef.current) {
                setData(workspace);
            }
        } catch (error) {
            if (requestId !== requestIdRef.current) {
                return;
            }

            const fallback = archived
                ? 'Unable to load archived offer comparisons. Please try again.'
                : 'Unable to load offer comparisons. Please try again.';
            showErrorToast(getErrorToastMessage(error, fallback));
            setLoadFailed(true);
        } finally {
            if (requestId === requestIdRef.current) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        void loadWorkspace();

        return () => {
            requestIdRef.current += 1;
        };
    }, [archived]);

    const saveEvaluation = async (jobId: number, request: SaveOfferEvaluationRequest) => {
        const isNewEvaluation =
            data?.applications.some((application) => application.job_id === jobId && !application.evaluation) ?? false;
        try {
            await api.offerDecision.saveEvaluation({ jobId, ...request });
            setData((current) => {
                if (!current) {
                    return current;
                }

                return {
                    applications: current.applications.map((application) =>
                        application.job_id === jobId
                            ? {
                                  ...application,
                                  evaluation: {
                                      job_id: jobId,
                                      ratings: { ...request.ratings },
                                      details: { ...request.details },
                                      updated_at: new Date().toISOString(),
                                  },
                              }
                            : application
                    ),
                };
            });
            if (isNewEvaluation) {
                showSuccessToast('Offer evaluation added.');
            }
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to save the offer evaluation. Please try again.'));
            throw error;
        }
    };

    const deleteEvaluation = async (jobId: number) => {
        try {
            await api.offerDecision.deleteEvaluation({ jobId });
            setData((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    applications: current.applications.flatMap((application) => {
                        if (application.job_id !== jobId) {
                            return [application];
                        }
                        return !archived && application.job_status === 'Offer'
                            ? [{ ...application, evaluation: null }]
                            : [];
                    }),
                };
            });
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to delete offer evaluation. Please try again.'));
            throw error;
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingState}>
                <LoadingSpinner title={archived ? 'Loading archived offer comparisons' : 'Loading offer comparisons'} />
            </div>
        );
    }

    if (loadFailed || !data) {
        return (
            <EmptyState
                description='Your saved data is unchanged. Try loading the workspace again.'
                icon='briefcase'
                primaryAction={{ label: 'Try again', onClick: () => void loadWorkspace() }}
                title='Offer comparisons are unavailable'
            />
        );
    }

    return (
        <OfferDecisionWorkspace
            data={data}
            onDelete={deleteEvaluation}
            onSave={archived ? undefined : saveEvaluation}
            readOnly={archived}
        />
    );
};

export default OfferDecisionPage;
