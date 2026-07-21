import { useMemo } from 'react';
import { useDemo } from '../context/DemoContext';
import OfferDecisionWorkspace from '../../offerDecision/OfferDecisionWorkspace';
import type { SaveOfferEvaluationRequest } from '../../offerDecision/models';
import { selectArchivedOfferDecisionWorkspace, selectOfferDecisionWorkspace } from '../state/demoSelectors';
import { useToast } from '../../../components/toast/ToastProvider';

type DemoOfferDecisionPageProps = {
    archived: boolean;
};

const DemoOfferDecisionPage = ({ archived }: DemoOfferDecisionPageProps) => {
    const { dispatch, state } = useDemo();
    const { showSuccessToast } = useToast();
    const data = useMemo(
        () => (archived ? selectArchivedOfferDecisionWorkspace(state) : selectOfferDecisionWorkspace(state)),
        [archived, state]
    );

    const saveEvaluation = async (jobId: number, request: SaveOfferEvaluationRequest) => {
        const isNewEvaluation = !state.offerEvaluations[jobId];
        dispatch({
            type: 'SAVE_OFFER_EVALUATION',
            payload: { jobId, request, updatedAt: new Date().toISOString() },
        });
        if (isNewEvaluation) {
            showSuccessToast('Offer evaluation added.');
        }
    };

    const deleteEvaluation = async (jobId: number) => {
        dispatch({ type: 'DELETE_OFFER_EVALUATION', payload: { jobId } });
    };

    return (
        <OfferDecisionWorkspace
            data={data}
            onDelete={deleteEvaluation}
            onSave={archived ? undefined : saveEvaluation}
            readOnly={archived}
        />
    );
};

export default DemoOfferDecisionPage;
