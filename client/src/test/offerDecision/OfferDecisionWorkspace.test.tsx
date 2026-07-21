import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import OfferDecisionWorkspace from '../../pages/offerDecision/OfferDecisionWorkspace';
import formatDate, { parseDatetimeLocal, toDatetimeLocalInputValue } from '../../helper/dateFormatter';
import type {
    OfferDecisionWorkspaceData,
    OfferEvaluation,
    SaveOfferEvaluationRequest,
} from '../../pages/offerDecision/models';

const mockConfirm = vi.hoisted(() => vi.fn());

vi.mock('material-ui-confirm', () => ({ useConfirm: () => mockConfirm }));

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

const createEvaluation = (
    jobId: number,
    ratings = {
        career_growth: 5,
        company_culture_fit: 4,
        work_life_balance: 3,
        compensation: 4,
    },
    decisionDeadline = details.decision_deadline
): OfferEvaluation => ({
    job_id: jobId,
    ratings,
    details: { ...details, decision_deadline: decisionDeadline },
    updated_at: '2026-07-18T08:00:00.000Z',
});

const activeData: OfferDecisionWorkspaceData = {
    applications: [
        {
            job_id: 11,
            company_name: 'Acme',
            job_title: 'Software Engineer',
            job_status: 'Offer',
            application_date: '2026-07-01T08:00:00.000Z',
            evaluation: createEvaluation(11),
        },
        {
            job_id: 12,
            company_name: 'Beta Labs',
            job_title: 'Platform Developer',
            job_status: 'Offer',
            application_date: '2026-07-02T08:00:00.000Z',
            evaluation: null,
        },
        {
            job_id: 13,
            company_name: 'Continuum',
            job_title: 'Product Engineer',
            job_status: 'Accepted',
            application_date: '2026-06-15T08:00:00.000Z',
            evaluation: createEvaluation(13),
        },
    ],
};

type HarnessProps = {
    initialData?: OfferDecisionWorkspaceData;
    onSave?: (jobId: number, request: SaveOfferEvaluationRequest) => Promise<void>;
};

const WorkspaceHarness = ({
    initialData = activeData,
    onSave = vi.fn().mockResolvedValue(undefined),
}: HarnessProps) => {
    const [data, setData] = useState(initialData);

    const saveEvaluation = async (jobId: number, request: SaveOfferEvaluationRequest) => {
        await onSave(jobId, request);
        setData((current) => ({
            applications: current.applications.map((application) =>
                application.job_id === jobId
                    ? {
                          ...application,
                          evaluation: {
                              job_id: jobId,
                              ratings: request.ratings,
                              details: request.details,
                              updated_at: '2026-07-18T09:00:00.000Z',
                          },
                      }
                    : application
            ),
        }));
    };

    return <OfferDecisionWorkspace data={data} onDelete={vi.fn()} onSave={saveEvaluation} readOnly={false} />;
};

describe('OfferDecisionWorkspace', () => {
    beforeEach(() => {
        mockConfirm.mockReset();
        mockConfirm.mockResolvedValue({ confirmed: true });
    });

    test('separates unevaluated, evaluated and previous offers without global importance or save controls', () => {
        render(<OfferDecisionWorkspace data={activeData} onDelete={vi.fn()} onSave={vi.fn()} readOnly={false} />);

        expect(screen.getByRole('heading', { name: 'Offers to evaluate' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Evaluated offers' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Previous evaluations' })).toBeInTheDocument();
        expect(screen.queryByText('Set what matters')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Save comparisons' })).not.toBeInTheDocument();

        const unevaluatedSection = screen.getByRole('heading', { name: 'Offers to evaluate' }).closest('section');
        const evaluatedSection = screen.getByRole('heading', { name: 'Evaluated offers' }).closest('section');
        expect(unevaluatedSection).not.toBeNull();
        expect(evaluatedSection).not.toBeNull();
        expect(
            within(unevaluatedSection as HTMLElement).getByRole('article', { name: 'Beta Labs Platform Developer' })
        ).toBeInTheDocument();
        expect(
            within(evaluatedSection as HTMLElement).getByRole('article', { name: 'Acme Software Engineer' })
        ).toBeInTheDocument();
    });

    test('adds one SGD draft, saves it per application, moves it and relocks it', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        render(<WorkspaceHarness onSave={onSave} />);

        fireEvent.click(screen.getByRole('button', { name: 'Add evaluation for Beta Labs' }));

        expect(screen.getByLabelText('Beta Labs currency')).toHaveValue('SGD');
        expect(screen.getByLabelText('Beta Labs monthly base salary')).toHaveValue(null);
        expect(screen.getByLabelText('Beta Labs work arrangement')).toHaveValue('');
        expect(screen.getByRole('button', { name: 'Save evaluation for Beta Labs' })).toBeEnabled();
        expect(
            within(
                screen.getByRole('heading', { name: 'Offers to evaluate' }).closest('section') as HTMLElement
            ).getByRole('article', { name: 'Beta Labs Platform Developer' })
        ).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Beta Labs decision deadline'), {
            target: { value: '2026-08-20T10:00' },
        });
        fireEvent.change(screen.getByLabelText('Beta Labs monthly base salary'), { target: { value: '9000' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save evaluation for Beta Labs' }));

        await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
        expect(onSave).toHaveBeenCalledWith(12, {
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
        });

        const evaluatedSection = screen.getByRole('heading', { name: 'Evaluated offers' }).closest('section');
        expect(
            await within(evaluatedSection as HTMLElement).findByRole('article', {
                name: 'Beta Labs Platform Developer',
            })
        ).toBeInTheDocument();
        expect(screen.queryByLabelText('Beta Labs currency')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Edit evaluation for Beta Labs' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Hide details for Beta Labs' })).toBeInTheDocument();
    });

    test('uses native form submission and places offer terms before ratings', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        render(<WorkspaceHarness onSave={onSave} />);

        fireEvent.click(screen.getByRole('button', { name: 'Add evaluation for Beta Labs' }));
        const card = screen.getByRole('article', { name: 'Beta Labs Platform Developer' });
        const groups = within(card).getAllByRole('group');
        expect(groups.map((group) => group.querySelector('legend')?.textContent)).toEqual([
            'Decision timing',
            'Compensation and terms',
            'Fit ratings',
        ]);

        fireEvent.change(screen.getByLabelText('Beta Labs decision deadline'), {
            target: { value: '2026-08-20T10:00' },
        });
        fireEvent.change(screen.getByLabelText('Beta Labs monthly base salary'), { target: { value: '9000' } });
        const saveButton = screen.getByRole('button', { name: 'Save evaluation for Beta Labs' });
        expect(saveButton).toHaveAttribute('type', 'submit');
        fireEvent.submit(saveButton.closest('form') as HTMLFormElement);

        await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    });

    test('cancels a new draft without affecting saved records', () => {
        render(<WorkspaceHarness />);

        fireEvent.click(screen.getByRole('button', { name: 'Add evaluation for Beta Labs' }));
        fireEvent.change(screen.getByLabelText('Beta Labs bonus'), { target: { value: '20% target' } });
        fireEvent.click(screen.getByRole('button', { name: 'Cancel evaluation for Beta Labs' }));

        expect(screen.getByRole('button', { name: 'Add evaluation for Beta Labs' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Beta Labs bonus')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Edit evaluation for Acme' })).toBeInTheDocument();
    });

    test('unlocks a saved evaluation only on edit and relocks it after a changed save', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        render(<WorkspaceHarness onSave={onSave} />);

        expect(screen.queryByLabelText('Acme monthly base salary')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Edit evaluation for Acme' }));

        const saveButton = screen.getByRole('button', { name: 'Save evaluation for Acme' });
        expect(screen.getByLabelText('Acme monthly base salary')).toHaveValue(10000);
        expect(saveButton).toBeEnabled();

        fireEvent.change(screen.getByLabelText('Acme monthly base salary'), { target: { value: '11000' } });
        expect(saveButton).toBeEnabled();
        fireEvent.click(saveButton);

        await waitFor(() => expect(onSave).toHaveBeenCalledWith(11, expect.any(Object)));
        expect(screen.queryByLabelText('Acme monthly base salary')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Edit evaluation for Acme' })).toBeInTheDocument();
        expect(screen.getByText('SGD 11,000')).toBeInTheDocument();
    });

    test('uses the shared date-time input format and formatted locked deadline', () => {
        render(<WorkspaceHarness />);

        fireEvent.click(screen.getByRole('button', { name: 'Show details for Acme' }));
        expect(screen.getAllByText(formatDate(details.decision_deadline).formattedDate)).not.toHaveLength(0);

        fireEvent.click(screen.getByRole('button', { name: 'Edit evaluation for Acme' }));
        const deadlineInput = screen.getByLabelText('Acme decision deadline');
        expect(deadlineInput).toHaveAttribute('type', 'datetime-local');
        expect(deadlineInput).toHaveAttribute(
            'min',
            toDatetimeLocalInputValue(activeData.applications[0].application_date)
        );
        expect(deadlineInput).toHaveValue(toDatetimeLocalInputValue(details.decision_deadline));
    });

    test('cancels a saved edit and restores its locked values', () => {
        render(<WorkspaceHarness />);

        fireEvent.click(screen.getByRole('button', { name: 'Edit evaluation for Acme' }));
        fireEvent.change(screen.getByLabelText('Acme bonus'), { target: { value: 'Changed' } });
        fireEvent.click(screen.getByRole('button', { name: 'Cancel evaluation for Acme' }));

        expect(screen.queryByLabelText('Acme bonus')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Show details for Acme' })).toBeInTheDocument();
        expect(screen.queryByText('15% target')).not.toBeInTheDocument();
        expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    });

    test('shows field validation and does not save invalid negative values or an earlier deadline', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        render(<WorkspaceHarness onSave={onSave} />);

        fireEvent.click(screen.getByRole('button', { name: 'Edit evaluation for Acme' }));
        fireEvent.change(screen.getByLabelText('Acme monthly base salary'), { target: { value: '-1' } });
        fireEvent.change(screen.getByLabelText('Acme annual leave days'), { target: { value: '-1' } });
        fireEvent.change(screen.getByLabelText('Acme decision deadline'), {
            target: { value: '2026-06-30T10:00' },
        });
        const deadlineInput = screen.getByLabelText('Acme decision deadline');
        const scrollIntoView = vi.fn();
        deadlineInput.scrollIntoView = scrollIntoView;
        fireEvent.click(screen.getByRole('button', { name: 'Save evaluation for Acme' }));

        expect(
            await screen.findByText('Monthly base salary must be a whole number from 0 to 1000000000.')
        ).toBeInTheDocument();
        expect(screen.getByText('Annual leave must be a whole number from 0 to 365.')).toBeInTheDocument();
        expect(screen.getByText('Decision deadline cannot be earlier than the application date.')).toBeInTheDocument();
        expect(deadlineInput).toHaveFocus();
        expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
        expect(onSave).not.toHaveBeenCalled();
    });

    test('scrolls to and focuses an invalid optional annual leave field', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        render(<WorkspaceHarness onSave={onSave} />);

        fireEvent.click(screen.getByRole('button', { name: 'Edit evaluation for Acme' }));
        const annualLeaveInput = screen.getByLabelText('Acme annual leave days');
        const scrollIntoView = vi.fn();
        annualLeaveInput.scrollIntoView = scrollIntoView;
        fireEvent.change(annualLeaveInput, { target: { value: '-1' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save evaluation for Acme' }));

        expect(await screen.findByText('Annual leave must be a whole number from 0 to 365.')).toBeInTheDocument();
        expect(annualLeaveInput).toHaveFocus();
        expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
        expect(onSave).not.toHaveBeenCalled();
    });

    test('shows an inline error, focuses the field and does not save a partial decision deadline', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        render(<WorkspaceHarness onSave={onSave} />);

        fireEvent.click(screen.getByRole('button', { name: 'Edit evaluation for Acme' }));
        const deadlineInput = screen.getByLabelText('Acme decision deadline');
        fireEvent.change(deadlineInput, { target: { value: '' } });
        Object.defineProperty(deadlineInput, 'validity', {
            configurable: true,
            value: { badInput: true },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save evaluation for Acme' }));

        expect(await screen.findByText('Please enter a valid decision deadline.')).toBeInTheDocument();
        expect(deadlineInput).toHaveFocus();
        expect(onSave).not.toHaveBeenCalled();
    });

    test('expands and collapses saved cards independently', () => {
        const data: OfferDecisionWorkspaceData = {
            applications: [
                activeData.applications[0],
                { ...activeData.applications[1], evaluation: createEvaluation(12) },
            ],
        };
        render(<OfferDecisionWorkspace data={data} onDelete={vi.fn()} onSave={vi.fn()} readOnly={false} />);

        fireEvent.click(screen.getByRole('button', { name: 'Show details for Acme' }));
        expect(screen.getByRole('button', { name: 'Hide details for Acme' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Show details for Beta Labs' })).toBeInTheDocument();
        expect(screen.getAllByText('15% target')).toHaveLength(1);
        const acmeCard = screen.getByRole('article', { name: 'Acme Software Engineer' });
        const salaryLabel = within(acmeCard).getByText('Monthly Base Salary');
        const ratingLabel = within(acmeCard).getByText('Company/Culture Fit');
        expect(ratingLabel.compareDocumentPosition(salaryLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Hide details for Acme' }));
        expect(screen.queryByText('15% target')).not.toBeInTheDocument();
    });

    test('hides optional offer terms that were not added in the locked view', () => {
        const evaluation = createEvaluation(11);
        evaluation.details = {
            ...evaluation.details,
            bonus: '',
            annual_leave_days: null,
            work_arrangement: '',
            pros: '',
            concerns: '',
        };

        render(
            <OfferDecisionWorkspace
                data={{ applications: [{ ...activeData.applications[0], evaluation }] }}
                onDelete={vi.fn()}
                onSave={vi.fn()}
                readOnly={false}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Show details for Acme' }));
        const card = screen.getByRole('article', { name: 'Acme Software Engineer' });

        expect(within(card).getByText('Monthly Base Salary')).toBeInTheDocument();
        expect(within(card).queryByText('Bonus')).not.toBeInTheDocument();
        expect(within(card).queryByText('Annual Leave')).not.toBeInTheDocument();
        expect(within(card).queryByText('Work Arrangement')).not.toBeInTheDocument();
        expect(within(card).queryByText('Pros')).not.toBeInTheDocument();
        expect(within(card).queryByText('Cons')).not.toBeInTheDocument();
    });

    test('sorts evaluated cards and exposes count-aware grid layouts', () => {
        const high = {
            career_growth: 5,
            company_culture_fit: 5,
            work_life_balance: 5,
            compensation: 5,
        } as const;
        const tied = {
            career_growth: 4,
            company_culture_fit: 4,
            work_life_balance: 4,
            compensation: 4,
        } as const;
        const applications = [
            {
                ...activeData.applications[0],
                job_id: 4,
                company_name: 'Fourth',
                evaluation: createEvaluation(4, tied, ''),
            },
            {
                ...activeData.applications[0],
                job_id: 3,
                company_name: 'Third',
                evaluation: createEvaluation(3, high, ''),
            },
            {
                ...activeData.applications[0],
                job_id: 2,
                company_name: 'Second',
                evaluation: createEvaluation(2, tied, '2026-08-01T10:00:00.000Z'),
            },
            {
                ...activeData.applications[0],
                job_id: 1,
                company_name: 'First',
                evaluation: createEvaluation(1, tied, '2026-08-01T10:00:00.000Z'),
            },
        ];

        const { rerender } = render(
            <OfferDecisionWorkspace data={{ applications }} onDelete={vi.fn()} onSave={vi.fn()} readOnly={false} />
        );
        const evaluatedSection = screen.getByRole('heading', { name: 'Evaluated offers' }).closest('section');
        expect(
            within(evaluatedSection as HTMLElement)
                .getAllByRole('article')
                .map((article) => article.getAttribute('aria-label'))
        ).toEqual([
            'First Software Engineer',
            'Second Software Engineer',
            'Third Software Engineer',
            'Fourth Software Engineer',
        ]);
        expect(within(evaluatedSection as HTMLElement).getByTestId('offer-evaluation-grid')).toHaveAttribute(
            'data-card-count',
            'many'
        );

        rerender(
            <OfferDecisionWorkspace
                data={{ applications: applications.slice(0, 2) }}
                onDelete={vi.fn()}
                onSave={vi.fn()}
                readOnly={false}
            />
        );
        expect(screen.getByTestId('offer-evaluation-grid')).toHaveAttribute('data-card-count', 'two');

        rerender(
            <OfferDecisionWorkspace
                data={{ applications: applications.slice(0, 1) }}
                onDelete={vi.fn()}
                onSave={vi.fn()}
                readOnly={false}
            />
        );
        expect(screen.getByTestId('offer-evaluation-grid')).toHaveAttribute('data-card-count', 'one');
    });

    test('keeps active previous evaluations deletable and archived evaluations review-only', async () => {
        const onDelete = vi.fn().mockResolvedValue(undefined);
        const { rerender } = render(
            <OfferDecisionWorkspace data={activeData} onDelete={onDelete} onSave={vi.fn()} readOnly={false} />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Delete evaluation for Continuum' }));
        await waitFor(() => expect(onDelete).toHaveBeenCalledWith(13));
        expect(mockConfirm).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'Confirm Deletion', confirmationText: 'Delete' })
        );

        rerender(
            <OfferDecisionWorkspace
                data={{ applications: [activeData.applications[0]] }}
                onDelete={onDelete}
                readOnly
            />
        );
        expect(screen.getByRole('heading', { name: 'Archived evaluated offers' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Archived Offer Comparisons' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /edit evaluation/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete evaluation/i })).toBeInTheDocument();
    });

    test('keeps expired current offers editable and expired badges out of previous evaluations', () => {
        const expiredDeadline = '2026-07-01T10:00:00.000Z';
        const expiredOffer = {
            ...activeData.applications[0],
            evaluation: createEvaluation(11, undefined, expiredDeadline),
        };
        const previousEvaluation = {
            ...activeData.applications[2],
            evaluation: createEvaluation(13, undefined, expiredDeadline),
        };

        render(
            <OfferDecisionWorkspace
                data={{ applications: [expiredOffer, previousEvaluation] }}
                onDelete={vi.fn()}
                onSave={vi.fn()}
                readOnly={false}
            />
        );

        const expiredSection = screen.getByRole('heading', { name: 'Expired evaluated offers' }).closest('section');
        const previousSection = screen.getByRole('heading', { name: 'Previous evaluations' }).closest('section');
        expect(expiredSection).not.toBeNull();
        expect(previousSection).not.toBeNull();
        expect(within(expiredSection as HTMLElement).getByText('Expired')).toBeInTheDocument();
        expect(within(expiredSection as HTMLElement).getByRole('button', { name: /delete evaluation/i })).toBeEnabled();
        fireEvent.click(
            within(expiredSection as HTMLElement).getByRole('button', { name: 'Edit evaluation for Acme' })
        );
        expect(within(expiredSection as HTMLElement).getByLabelText('Acme monthly base salary')).toHaveValue(10000);
        expect(within(previousSection as HTMLElement).queryByText('Expired')).toBeNull();
    });

    test('uses archived sections without an unevaluated section or edit actions', () => {
        const expiredOffer = {
            ...activeData.applications[0],
            evaluation: createEvaluation(11, undefined, '2026-07-01T10:00:00.000Z'),
        };

        render(
            <OfferDecisionWorkspace
                data={{ applications: [expiredOffer, activeData.applications[2]] }}
                onDelete={vi.fn()}
                readOnly
            />
        );

        expect(screen.getByRole('heading', { name: 'Archived expired evaluated offers' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Archived previous evaluations' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /offers to evaluate/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /edit evaluation/i })).not.toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /delete evaluation/i })).toHaveLength(2);
    });

    test('renders purpose-built empty states', () => {
        const { rerender } = render(<OfferDecisionWorkspace data={{ applications: [] }} readOnly={false} />);
        const activeEmptyState = screen.getByRole('heading', { name: 'No offers to compare' }).closest('section');
        expect(activeEmptyState?.className).toContain('followsControls');
        expect(
            screen.getByText(
                'Applications with Offer status appear here, along with saved evaluations that later move to Accepted or Declined.'
            )
        ).toBeInTheDocument();

        rerender(<OfferDecisionWorkspace data={{ applications: [] }} readOnly />);
        const archivedEmptyState = screen
            .getByRole('heading', { name: 'No archived offer comparisons' })
            .closest('section');
        expect(archivedEmptyState?.className).toContain('followsControls');
    });
});
