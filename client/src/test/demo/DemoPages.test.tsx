import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
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

        expect(screen.getByText(/Atlas RecruitTech/i)).toBeInTheDocument();

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

    test('uses empty job URLs for built-in demo application data', () => {
        const state = createDemoInitialState();
        const activeJobUrls = state.applications.map((application) => application.job_posting_url);
        const archivedJobUrls = state.archivedApplications.map((application) => application.job_posting_url);

        expect(activeJobUrls.every((jobURL) => jobURL === '')).toBe(true);
        expect(archivedJobUrls.every((jobURL) => jobURL === '')).toBe(true);
    });
});
