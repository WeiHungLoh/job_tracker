import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import DemoAddApplication from '../../pages/demo/application/jobApplication/addApplication/DemoAddApplication';
import DemoAddInterview from '../../pages/demo/interview/jobInterview/addInterview/DemoAddInterview';
import { DemoProvider, useDemo } from '../../pages/demo/context/DemoContext';
import DemoDashboard from '../../pages/demo/dashboard/DemoDashboard';
import DemoViewApplication from '../../pages/demo/application/jobApplication/viewApplication/DemoViewApplication';
import DemoViewArchivedApplication from '../../pages/demo/application/archivedApplication/viewArchivedApplication/DemoViewArchivedApplication';
import DemoViewInterview from '../../pages/demo/interview/jobInterview/viewInterview/DemoViewInterview';
import DemoViewArchivedInterview from '../../pages/demo/interview/archivedInterview/viewArchivedInterview/DemoViewArchivedInterview';
import { UserPreferencesProvider } from '../../components/userPreferences/UserPreferencesProvider';
import { createDemoInitialState } from '../../pages/demo/state/demoInitialState';
import { daysFromNow, toDateTimeString } from '../../pages/demo/state/demoDateHelpers';
import { render } from '../renderWithToast';
import { routes } from '../../routes';
import userEvent from '@testing-library/user-event';
import DemoRoutes from '../../pages/demo/components/demoLayout/DemoRoutes';

const mockConfirm = vi.fn();

vi.mock('material-ui-confirm', () => ({
    useConfirm: () => mockConfirm,
}));

vi.mock('react-chartjs-2', () => ({
    Bar: () => <div>Demo bar chart</div>,
    Line: () => <div>Demo line chart</div>,
}));

const DemoPreferenceBridge = ({ children }: { children: ReactNode }) => {
    const { state, updatePreferences } = useDemo();

    return (
        <UserPreferencesProvider preferences={state.preferences} updatePreferences={updatePreferences}>
            {children}
        </UserPreferencesProvider>
    );
};

type DemoInitialEntry = string | { pathname: string; state?: unknown };

const renderDemo = (children: ReactNode, initialEntries: DemoInitialEntry[] = [routes.demoViewApplications]) => {
    render(
        <MemoryRouter initialEntries={initialEntries}>
            <DemoProvider>
                <DemoPreferenceBridge>{children}</DemoPreferenceBridge>
            </DemoProvider>
        </MemoryRouter>
    );
};

const clickConfirmedAction = async (button: HTMLElement) => {
    await act(async () => {
        await userEvent.click(button);
    });
};

const SetApplicationViewMode = ({ archived = false }: { archived?: boolean }) => {
    const { updatePreferences } = useDemo();

    return (
        <button
            onClick={() =>
                void updatePreferences(
                    archived ? { archived_application_view_mode: 'board' } : { application_view_mode: 'board' }
                )
            }
            type='button'
        >
            Set application Board mode
        </button>
    );
};

const DemoRouteHarness = () => (
    <Routes>
        <Route path={`${routes.demoRoot}/*`} element={<DemoRoutes />} />
    </Routes>
);

const SetInterviewBoardMode = () => {
    const { updatePreferences } = useDemo();

    return (
        <button onClick={() => void updatePreferences({ interview_view_mode: 'board' })} type='button'>
            Set interview Board mode
        </button>
    );
};

describe('demo page interactions', () => {
    beforeEach(() => {
        mockConfirm.mockReset();
    });

    test('updates application notes and status with auto-scroll highlighting', async () => {
        renderDemo(<DemoViewApplication />);

        expect(screen.getByText(/HorizonAI Labs/i)).toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: /click here to head to job application url/i })
        ).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Display options' }));
        expect(screen.getByRole('switch', { name: 'Show notes' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('switch', { name: 'Show archive' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('switch', { name: 'Auto scroll after job status change' })).toHaveAttribute(
            'aria-checked',
            'true'
        );
        const firstApplicationCard = screen.getAllByRole('button', { name: 'Edit Status' })[0].closest('[id]');
        const firstApplicationId = firstApplicationCard?.id;
        expect(firstApplicationId).toBeTruthy();
        const firstNotesField = screen.getAllByPlaceholderText('Add your notes here')[0];
        fireEvent.change(firstNotesField, {
            target: { value: 'Demo note update' },
        });
        expect(firstNotesField).toHaveValue('Demo note update');

        await userEvent.click(screen.getAllByRole('button', { name: 'Edit Status' })[0]);
        fireEvent.change(screen.getByRole('listbox'), { target: { value: 'Offer' } });
        await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
        expect(screen.getAllByText(/Job Status: Offer/i).length).toBeGreaterThan(0);
        await waitFor(() =>
            expect(document.getElementById(firstApplicationId || '')?.className).toContain('highlighted')
        );
    });

    test('updates board status and archives without success toasts', async () => {
        renderDemo(<DemoViewApplication />);

        await userEvent.click(screen.getByRole('button', { name: 'Board' }));
        expect(screen.getByRole('region', { name: 'Application board' })).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText(/Move HorizonAI Labs to status/i), {
            target: { value: 'Rejected' },
        });

        await userEvent.click(screen.getByRole('button', { name: 'List' }));
        expect(screen.getAllByText(/Job Status: Rejected/i).length).toBeGreaterThan(0);

        await userEvent.click(screen.getAllByRole('button', { name: 'Archive' })[0]);
        expect(screen.queryByText('Application archived.')).not.toBeInTheDocument();
    });

    test('keeps independent list and board sorting preferences in the demo', async () => {
        renderDemo(<DemoViewApplication />);

        expect(await screen.findByRole('heading', { name: '1. Pinecone Health' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Sort by' }));
        await userEvent.click(screen.getByRole('radio', { name: /Company A/ }));
        expect(await screen.findByRole('heading', { name: '1. Aster Security' })).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole('button', { name: 'Sort by' })).toBeEnabled());

        await userEvent.click(screen.getByRole('button', { name: 'Board' }));
        await userEvent.click(screen.getByRole('button', { name: 'Sort by' }));
        expect(screen.getByRole('radio', { name: 'Newest Application' })).toBeChecked();
        await userEvent.click(screen.getByRole('radio', { name: 'Oldest Application' }));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Sort by' })).toBeEnabled());

        const appliedColumn = screen.getByRole('heading', { name: 'Applied 6' }).closest('section');
        if (!appliedColumn) {
            throw new Error('Expected the Applied board column.');
        }
        expect(appliedColumn.querySelector('article')).toHaveAccessibleName(/Northstar Mobility/);

        await userEvent.click(screen.getByRole('button', { name: 'List' }));
        await userEvent.click(screen.getByRole('button', { name: 'Sort by' }));
        expect(screen.getByRole('radio', { name: /Company A/ })).toBeChecked();
        expect(screen.getByRole('heading', { name: '1. Aster Security' })).toBeInTheDocument();
    });

    test('restores and deletes archived applications without success toasts', async () => {
        renderDemo(<DemoViewArchivedApplication />, [routes.demoArchivedApplications]);

        expect(screen.getByText(/Riverlane Studio/i)).toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: /click here to head to job application url/i })
        ).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Display options' }));
        expect(screen.getByRole('switch', { name: 'Show notes' })).toHaveAttribute('aria-checked', 'true');

        await userEvent.click(screen.getAllByRole('button', { name: 'Unarchive' })[0]);
        expect(screen.queryByText('Application restored.')).not.toBeInTheDocument();

        mockConfirm.mockResolvedValueOnce({ confirmed: true });
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await clickConfirmedAction(screen.getByRole('button', { name: /delete all archived applications/i }));
        expect(screen.queryByText('Archived applications deleted.')).not.toBeInTheDocument();
        expect(await screen.findByRole('heading', { name: 'No archived applications yet' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View active applications' })).toHaveAttribute(
            'href',
            routes.demoViewApplications
        );

        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Offer' }));
        expect(
            await screen.findByRole('heading', { name: 'No archived applications match your filters' })
        ).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
        expect(await screen.findByRole('heading', { name: 'No archived applications yet' })).toBeInTheDocument();
    });

    test('validates and creates demo applications', async () => {
        renderDemo(<DemoAddApplication />, [routes.demoAddApplication]);

        expect(screen.queryByRole('heading', { name: 'Add Job Application' })).not.toBeInTheDocument();
        await userEvent.type(screen.getByLabelText(/company name/i), 'Demo Form Company');
        await userEvent.type(screen.getByLabelText(/job title/i), 'Demo Form Engineer');
        await userEvent.type(screen.getByLabelText(/job posting url/i), 'not-a-url');
        await userEvent.click(screen.getByRole('button', { name: /^add job application$/i }));
        expect(screen.getByText('URL must be in a valid format.')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(/job posting url/i), {
            target: { value: 'https://jobs.example.com/demo-form-engineer' },
        });
        await userEvent.click(screen.getByRole('button', { name: /^add job application$/i }));
        expect(screen.getByText('Successfully added a job application!')).toBeInTheDocument();
        expect(screen.getByLabelText(/company name/i)).toHaveValue('');
        expect(screen.getByLabelText(/job title/i)).toHaveValue('');
    });

    test('validates and creates demo interviews', async () => {
        const app = createDemoInitialState().applications.find((application) => application.job_id === 107);
        if (!app) {
            throw new Error('Expected demo application fixture.');
        }

        renderDemo(<DemoAddInterview />, [{ pathname: routes.demoAddInterview, state: { app } }]);

        await userEvent.click(screen.getByRole('button', { name: /^add interview$/i }));
        expect(screen.getByText('Please enter a date and location before adding an interview.')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(/interview date/i), {
            target: { value: toDateTimeString(daysFromNow(new Date(), 4, 10)) },
        });
        await userEvent.type(screen.getByLabelText(/interview location/i), 'Zoom');
        await userEvent.type(screen.getByLabelText(/interview type/i), 'Technical interview');
        await userEvent.click(screen.getByRole('button', { name: /^add interview$/i }));

        expect(screen.getByText('Successfully added an interview!')).toBeInTheDocument();
        expect(screen.getByLabelText(/interview location/i)).toHaveValue('');
        expect(screen.getByLabelText(/interview type/i)).toHaveValue('');
    });

    test('deletes interviews without success toasts', async () => {
        renderDemo(<DemoViewInterview />, [routes.demoViewInterviews]);

        expect(within(screen.getByRole('region', { name: 'Active interviews' })).getAllByRole('article')).toHaveLength(
            9
        );

        mockConfirm.mockResolvedValueOnce({ confirmed: true });
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await clickConfirmedAction(screen.getByRole('button', { name: /delete all interviews/i }));
        await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
        expect(screen.queryByText('Interviews deleted.')).not.toBeInTheDocument();
        expect(await screen.findByRole('heading', { name: 'No interviews yet' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View applications' })).toHaveAttribute(
            'href',
            routes.demoViewApplications
        );
        expect(screen.queryByRole('link', { name: 'Add interview' })).not.toBeInTheDocument();
    });

    test('switches demo interviews to the responsive Board without changing their order', async () => {
        renderDemo(<DemoViewInterview />, [routes.demoViewInterviews]);

        const interviews = screen.getByRole('region', { name: 'Active interviews' });
        const listOrder = within(interviews)
            .getAllByRole('article')
            .map((card) => card.getAttribute('aria-label'));
        await userEvent.click(
            within(screen.getByRole('group', { name: 'Interview view' })).getByRole('button', { name: 'Board' })
        );

        expect(interviews).toHaveAttribute('data-layout', 'board');
        expect(
            within(interviews)
                .getAllByRole('article')
                .map((card) => card.getAttribute('aria-label'))
        ).toEqual(listOrder);
        expect(within(interviews).queryByText(/time left/i)).not.toBeInTheDocument();
        expect(within(interviews).queryByText(/notes:/i)).not.toBeInTheDocument();
        expect(
            within(interviews).queryByRole('link', { name: /review corresponding job application/i })
        ).not.toBeInTheDocument();
        expect(within(interviews).getAllByText('Actions').length).toBeGreaterThan(0);
    });

    test('renders active demo interviews in the production date order in List and Board views', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 6, 7, 12, 0, 0, 0));

        try {
            renderDemo(<DemoViewInterview />, [routes.demoViewInterviews]);
            const interviews = screen.getByRole('region', { name: 'Active interviews' });
            const expectedOrder = [
                'Merlion Cloud interview',
                'Atlas RecruitTech interview',
                'Harbour Analytics interview',
                'NovaStack interview',
                'Atlas RecruitTech interview',
                'Harbour Analytics interview',
                'NovaStack interview',
                'Quantum Ledger interview',
                'Merlion Cloud interview',
            ];

            expect(
                within(interviews)
                    .getAllByRole('article')
                    .map((card) => card.getAttribute('aria-label'))
            ).toEqual(expectedOrder);

            fireEvent.click(
                within(screen.getByRole('group', { name: 'Interview view' })).getByRole('button', { name: 'Board' })
            );
            expect(
                within(interviews)
                    .getAllByRole('article')
                    .map((card) => card.getAttribute('aria-label'))
            ).toEqual(expectedOrder);
        } finally {
            vi.useRealTimers();
        }
    });

    test('renders archived demo interviews in the production date order', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 6, 7, 12, 0, 0, 0));

        try {
            renderDemo(<DemoViewArchivedInterview />, [routes.demoArchivedInterviews]);

            expect(
                within(screen.getByRole('region', { name: 'Archived interviews' }))
                    .getAllByRole('article')
                    .map((card) => card.getAttribute('aria-label'))
            ).toEqual([
                'OrbitPay interview',
                'Keppel Digital interview',
                'SilverRail Labs interview',
                'Riverlane Studio interview',
            ]);
        } finally {
            vi.useRealTimers();
        }
    });

    test('blocks demo active corresponding navigation when active applications use Board view', async () => {
        renderDemo(
            <>
                <SetApplicationViewMode />
                <DemoViewInterview />
            </>,
            [routes.demoViewInterviews]
        );

        await userEvent.click(screen.getByRole('button', { name: 'Set application Board mode' }));
        await userEvent.click(screen.getAllByRole('link', { name: /review corresponding job application/i })[0]);

        expect(
            await screen.findByText(
                'The corresponding job application can only be opened while active applications are displayed in List view. Switch to List view and try again.'
            )
        ).toBeInTheDocument();
    });

    test('uses demo-only links for archived interview empty state', async () => {
        renderDemo(<DemoViewArchivedInterview />, [routes.demoArchivedInterviews]);

        mockConfirm.mockResolvedValueOnce({ confirmed: true });
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await clickConfirmedAction(screen.getByRole('button', { name: /delete all archived interviews/i }));

        expect(await screen.findByRole('heading', { name: 'No archived interviews yet' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View active interviews' })).toHaveAttribute(
            'href',
            routes.demoViewInterviews
        );
        expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    });

    test('supports archived demo interview Board mode and guards archived corresponding navigation', async () => {
        renderDemo(
            <>
                <SetApplicationViewMode archived />
                <DemoViewArchivedInterview />
            </>,
            [routes.demoArchivedInterviews]
        );

        await userEvent.click(
            within(screen.getByRole('group', { name: 'Archived interview view' })).getByRole('button', {
                name: 'Board',
            })
        );
        expect(screen.getByRole('region', { name: 'Archived interviews' })).toHaveAttribute('data-layout', 'board');
        expect(screen.queryByText(/time left/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/notes:/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /review corresponding job application/i })).not.toBeInTheDocument();

        await userEvent.click(
            within(screen.getByRole('group', { name: 'Archived interview view' })).getByRole('button', {
                name: 'List',
            })
        );
        await userEvent.click(screen.getByRole('button', { name: 'Set application Board mode' }));
        await userEvent.click(screen.getAllByRole('link', { name: /review corresponding job application/i })[0]);

        expect(
            await screen.findByText(
                'The corresponding archived job application can only be opened while archived applications are displayed in List view. Switch to List view and try again.'
            )
        ).toBeInTheDocument();
    });

    test('clears demo application filters in reducer state without backend calls', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        renderDemo(<DemoViewApplication />);

        mockConfirm.mockResolvedValueOnce({ confirmed: true });
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await clickConfirmedAction(screen.getByRole('button', { name: /delete all applications/i }));
        expect(await screen.findByRole('heading', { name: 'No active applications yet' })).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Declined' }));

        expect(await screen.findByRole('heading', { name: 'No applications match your filters' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

        expect(await screen.findByRole('heading', { name: 'No active applications yet' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        expect(screen.getByRole('checkbox', { name: 'Show All' })).toBeChecked();
        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    test('keeps demo application empty-state actions inside demo routes in board view', async () => {
        renderDemo(<DemoViewApplication />);

        await userEvent.click(screen.getByRole('button', { name: 'Board' }));
        mockConfirm.mockResolvedValueOnce({ confirmed: true });
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await clickConfirmedAction(screen.getByRole('button', { name: /delete all applications/i }));

        expect(await screen.findByRole('heading', { name: 'No active applications yet' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Add application' })).toHaveAttribute(
            'href',
            routes.demoAddApplication
        );
        expect(screen.queryByRole('region', { name: 'Application board' })).not.toBeInTheDocument();
    });

    test('renders dashboard from demo selectors', () => {
        renderDemo(<DemoDashboard />, [routes.demoDashboard]);

        expect(screen.getByText('Total Applications')).toBeInTheDocument();
        expect(screen.getByText('Demo line chart')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Upcoming Interviews' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Application Pipeline' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Closed Outcomes' })).toBeInTheDocument();
        expect(screen.getAllByText('Demo bar chart')).toHaveLength(2);
    });

    test('navigates from a demo dashboard status to the matching application filter without fetching', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        renderDemo(<DemoRouteHarness />, [routes.demoDashboard]);

        await userEvent.click(screen.getByRole('button', { name: 'View Offer applications' }));

        expect(await screen.findByRole('heading', { name: /Greenhouse CloudOps/ })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Quantum Ledger/ })).toBeInTheDocument();
        expect(screen.queryByText('HorizonAI Labs')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        expect(screen.getByRole('checkbox', { name: 'Offer' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Applied' })).not.toBeChecked();
        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    test('opens the exact demo dashboard interview in List view and highlights it without fetching', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        renderDemo(
            <>
                <SetInterviewBoardMode />
                <DemoRouteHarness />
            </>,
            [routes.demoDashboard]
        );

        await userEvent.click(screen.getByRole('button', { name: 'Set interview Board mode' }));
        await userEvent.click(screen.getByRole('button', { name: 'View Merlion Cloud interview' }));

        expect(await screen.findByRole('region', { name: 'Active interviews' })).toHaveAttribute('data-layout', 'list');
        await waitFor(() => expect(document.getElementById('401')?.className).toContain('highlighted'));
        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    test('uses empty job URLs for built-in demo application data', () => {
        const state = createDemoInitialState();
        const activeJobUrls = state.applications.map((application) => application.job_posting_url);
        const archivedJobUrls = state.archivedApplications.map((application) => application.job_posting_url);

        expect(activeJobUrls.every((jobURL) => jobURL === '')).toBe(true);
        expect(archivedJobUrls.every((jobURL) => jobURL === '')).toBe(true);
    });
});
