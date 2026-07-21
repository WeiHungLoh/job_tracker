import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { JobTrackerAPIError } from '../../api/models';
import OfferDecisionPage from '../../pages/offerDecision/OfferDecisionPage';
import type { OfferDecisionWorkspaceData, OfferEvaluation } from '../../pages/offerDecision/models';
import { parseDatetimeLocal } from '../../helper/dateFormatter';

const mocks = vi.hoisted(() => ({
    confirm: vi.fn(),
    deleteEvaluation: vi.fn(),
    getActive: vi.fn(),
    getArchived: vi.fn(),
    saveEvaluation: vi.fn(),
    showErrorToast: vi.fn(),
    showSuccessToast: vi.fn(),
}));

vi.mock('material-ui-confirm', () => ({ useConfirm: () => mocks.confirm }));

vi.mock('../../api/useJobTrackerAPI', () => ({
    useJobTrackerAPI: () => ({
        offerDecision: {
            deleteEvaluation: mocks.deleteEvaluation,
            getActive: mocks.getActive,
            getArchived: mocks.getArchived,
            saveEvaluation: mocks.saveEvaluation,
        },
    }),
}));

vi.mock('../../components/toast/ToastProvider', () => ({
    useToast: () => ({
        showErrorToast: mocks.showErrorToast,
        showSuccessToast: mocks.showSuccessToast,
    }),
}));

const details = {
    currency: 'SGD',
    monthly_base_salary: 10000,
    bonus: '15% target',
    annual_leave_days: 21,
    work_arrangement: 'Hybrid' as const,
    decision_deadline: '2026-08-15T10:00:00.000Z',
    pros: 'Strong product ownership',
    concerns: 'Two office days each week',
};

const ratings = {
    career_growth: 4,
    company_culture_fit: 4,
    work_life_balance: 4,
    compensation: 4,
};

const createEvaluation = (jobId: number): OfferEvaluation => ({
    job_id: jobId,
    ratings,
    details,
    updated_at: '2026-07-18T08:00:00.000Z',
});

const workspaceData: OfferDecisionWorkspaceData = {
    applications: [
        {
            job_id: 11,
            company_name: 'Acme',
            job_title: 'Engineer',
            job_status: 'Offer',
            application_date: '2026-07-01T08:00:00.000Z',
            evaluation: createEvaluation(11),
        },
        {
            job_id: 12,
            company_name: 'Past Co',
            job_title: 'Developer',
            job_status: 'Declined',
            application_date: '2026-06-01T08:00:00.000Z',
            evaluation: createEvaluation(12),
        },
        {
            job_id: 13,
            company_name: 'Beta Labs',
            job_title: 'Platform Developer',
            job_status: 'Offer',
            application_date: '2026-07-10T08:00:00.000Z',
            evaluation: null,
        },
    ],
};

const waitForActiveWorkspace = () => screen.findByRole('heading', { name: 'Evaluated offers' });

describe('OfferDecisionPage', () => {
    beforeEach(() => {
        Object.values(mocks).forEach((mock) => mock.mockReset());
        mocks.confirm.mockResolvedValue({ confirmed: true });
        mocks.deleteEvaluation.mockResolvedValue(null);
        mocks.getActive.mockResolvedValue(workspaceData);
        mocks.getArchived.mockResolvedValue(workspaceData);
        mocks.saveEvaluation.mockResolvedValue(null);
    });

    test('saves one new evaluation, moves it locally and does not refetch', async () => {
        render(<OfferDecisionPage archived={false} />);

        expect(await waitForActiveWorkspace()).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Offer Comparison' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Add evaluation for Beta Labs' }));
        fireEvent.change(screen.getByLabelText('Beta Labs decision deadline'), {
            target: { value: '2026-08-20T10:00' },
        });
        fireEvent.change(screen.getByLabelText('Beta Labs monthly base salary'), { target: { value: '9000' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save evaluation for Beta Labs' }));

        await waitFor(() =>
            expect(mocks.saveEvaluation).toHaveBeenCalledWith({
                jobId: 13,
                ratings: {
                    career_growth: 3,
                    company_culture_fit: 3,
                    work_life_balance: 3,
                    compensation: 3,
                },
                details: {
                    currency: 'SGD',
                    monthly_base_salary: 9000,
                    bonus: '',
                    annual_leave_days: null,
                    work_arrangement: '',
                    decision_deadline: parseDatetimeLocal('2026-08-20T10:00').toISOString(),
                    pros: '',
                    concerns: '',
                },
            })
        );
        expect(mocks.getActive).toHaveBeenCalledOnce();
        expect(mocks.getArchived).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Edit evaluation for Beta Labs' })).toBeInTheDocument();
        expect(mocks.showSuccessToast).toHaveBeenCalledWith('Offer evaluation added.');
    });

    test('does not show a success toast when a saved evaluation is updated', async () => {
        render(<OfferDecisionPage archived={false} />);
        await waitForActiveWorkspace();

        fireEvent.click(screen.getByRole('button', { name: 'Edit evaluation for Acme' }));
        fireEvent.change(screen.getByLabelText('Acme bonus'), { target: { value: '20% target' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save evaluation for Acme' }));

        await waitFor(() => expect(mocks.saveEvaluation).toHaveBeenCalledOnce());
        expect(mocks.showSuccessToast).not.toHaveBeenCalled();
    });

    test('shows inline validation without a duplicate toast for an earlier decision deadline', async () => {
        render(<OfferDecisionPage archived={false} />);
        await waitForActiveWorkspace();

        fireEvent.click(screen.getByRole('button', { name: 'Edit evaluation for Acme' }));
        fireEvent.change(screen.getByLabelText('Acme decision deadline'), {
            target: { value: '2026-06-30T10:00' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save evaluation for Acme' }));

        expect(screen.getByText('Decision deadline cannot be earlier than the application date.')).toBeInTheDocument();
        expect(screen.getByLabelText('Acme decision deadline')).toHaveFocus();
        expect(mocks.showErrorToast).not.toHaveBeenCalled();
        expect(mocks.saveEvaluation).not.toHaveBeenCalled();
    });

    test('uses the backend save message and preserves the editable draft after failure', async () => {
        mocks.saveEvaluation.mockRejectedValueOnce(
            new JobTrackerAPIError('Decision deadline cannot be earlier than the application date.', 422)
        );
        render(<OfferDecisionPage archived={false} />);
        await waitForActiveWorkspace();

        fireEvent.click(screen.getByRole('button', { name: 'Edit evaluation for Acme' }));
        fireEvent.change(screen.getByLabelText('Acme bonus'), { target: { value: '20% target' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save evaluation for Acme' }));

        await waitFor(() =>
            expect(mocks.showErrorToast).toHaveBeenCalledWith(
                'Decision deadline cannot be earlier than the application date.'
            )
        );
        expect(screen.getByLabelText('Acme bonus')).toHaveValue('20% target');
        expect(mocks.showSuccessToast).not.toHaveBeenCalled();
    });

    test('deletes an Offer evaluation locally and keeps its application ready to evaluate again', async () => {
        render(<OfferDecisionPage archived={false} />);
        await waitForActiveWorkspace();

        fireEvent.click(screen.getByRole('button', { name: 'Delete evaluation for Acme' }));

        await waitFor(() => expect(mocks.deleteEvaluation).toHaveBeenCalledWith({ jobId: 11 }));
        expect(await screen.findByRole('button', { name: 'Add evaluation for Acme' })).toBeInTheDocument();
        expect(mocks.getActive).toHaveBeenCalledOnce();
        expect(mocks.showSuccessToast).not.toHaveBeenCalled();
    });

    test('removes deleted previous history locally without deleting the application', async () => {
        render(<OfferDecisionPage archived={false} />);
        await screen.findByRole('heading', { name: 'Previous evaluations' });

        fireEvent.click(screen.getByRole('button', { name: 'Delete evaluation for Past Co' }));

        await waitFor(() => expect(mocks.deleteEvaluation).toHaveBeenCalledWith({ jobId: 12 }));
        await waitFor(() => {
            expect(screen.queryByRole('article', { name: 'Past Co Developer' })).not.toBeInTheDocument();
        });
        expect(mocks.getActive).toHaveBeenCalledOnce();
        expect(mocks.showSuccessToast).not.toHaveBeenCalled();
    });

    test('loads archived comparisons as read-only but keeps deletion available', async () => {
        render(<OfferDecisionPage archived />);

        expect(await screen.findByRole('heading', { name: 'Archived evaluated offers' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Archived Offer Comparisons' })).not.toBeInTheDocument();
        expect(mocks.getArchived).toHaveBeenCalledOnce();
        expect(mocks.getActive).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: /edit evaluation/i })).not.toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /delete evaluation/i })).not.toHaveLength(0);
        expect(screen.queryByRole('button', { name: /save evaluation/i })).not.toBeInTheDocument();
    });

    test('shows the standard load error and retries only on request', async () => {
        mocks.getActive.mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce(workspaceData);
        render(<OfferDecisionPage archived={false} />);

        expect(await screen.findByRole('heading', { name: 'Offer comparisons are unavailable' })).toBeInTheDocument();
        expect(mocks.showErrorToast).toHaveBeenCalledWith('Unable to load offer comparisons. Please try again.');
        expect(mocks.getActive).toHaveBeenCalledOnce();

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await waitForActiveWorkspace()).toBeInTheDocument();
        expect(mocks.getActive).toHaveBeenCalledTimes(2);
    });

    test('uses the backend delete message and preserves the evaluation after failure', async () => {
        mocks.deleteEvaluation.mockRejectedValueOnce(new JobTrackerAPIError('Evaluation no longer exists.', 404));
        render(<OfferDecisionPage archived={false} />);
        await waitForActiveWorkspace();

        fireEvent.click(screen.getByRole('button', { name: 'Delete evaluation for Acme' }));

        await waitFor(() => expect(mocks.showErrorToast).toHaveBeenCalledWith('Evaluation no longer exists.'));
        expect(screen.getByRole('button', { name: 'Delete evaluation for Acme' })).toBeInTheDocument();
        expect(mocks.showSuccessToast).not.toHaveBeenCalled();
    });
});
