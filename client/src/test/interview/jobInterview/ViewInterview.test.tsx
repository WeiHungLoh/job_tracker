import { act, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import ViewInterview from '../../../pages/interview/jobInterview/viewInterview/ViewInterview';
import { render } from '../../renderWithToast';
import userEvent from '@testing-library/user-event';
import type { UpdateUserPreferencesRequest, UserPreferences } from '../../../components/userPreferences/models';
import { JOB_STATUSES } from '../../../pages/application/models';

globalThis.fetch = vi.fn();

const mockInterview = {
    job_id: 1,
    interview_id: 1,
    company_name: 'ABC Pte Ltd',
    job_title: 'Software Engineer',
    job_status: 'Applied',
    interview_location: 'Changi Business Park',
    interview_type: 'HR',
    interview_notes: 'Bring resume',
    interview_date: '2025-06-20T00:00:00Z',
};

const mockPreferences: UserPreferences = {
    application_job_statuses: [...JOB_STATUSES],
    application_show_notes: false,
    application_show_archive: false,
    application_enable_scroll: false,
    application_view_mode: 'list',
    application_list_sort_order: 'job_status',
    application_board_sort_order: 'application_date_desc',
    archived_application_job_statuses: [...JOB_STATUSES],
    archived_application_show_notes: false,
    archived_application_view_mode: 'list',
    archived_application_list_sort_order: 'job_status',
    archived_application_board_sort_order: 'application_date_desc',
    interview_view_mode: 'list',
    archived_interview_view_mode: 'list',
};

const LocationStateProbe = () => {
    const location = useLocation();
    return <output data-testid='location-state'>{JSON.stringify(location.state)}</output>;
};

const response = (data?: unknown, status = 200) => ({
    headers: new Headers(data === undefined ? undefined : { 'content-type': 'application/json' }),
    json: async () => data,
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    text: async () => '',
    url: '',
});

const mockConfirm = vi.fn();
vi.mock('material-ui-confirm', () => ({
    useConfirm: () => mockConfirm,
}));

const clickConfirmedAction = async (button: HTMLElement) => {
    await act(async () => {
        await userEvent.click(button);
    });
};

describe('Job interview viewer flow', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        fetch.mockReset();
        fetch.mockImplementation(async (url: string, init?: RequestInit) => {
            if (url.endsWith('/job-interviews/summary')) {
                return response({ interview_count: 1 });
            }
            return init?.method === 'GET' ? response([mockInterview]) : response(undefined, 204);
        });
    });

    test('displays job interview details and action buttons', async () => {
        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>
        );

        expect(await screen.findByText(/abc pte ltd/i)).toBeInTheDocument();
        expect(screen.queryByText(/no job interview found/)).not.toBeInTheDocument();
        expect(screen.getByText(/software engineer/i)).toBeInTheDocument();
        expect(screen.getByText(/changi business park/i)).toBeInTheDocument();
        expect(screen.getByText(/hr/i)).toBeInTheDocument();
        expect(screen.getByText(/bring resume/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        expect(screen.getByRole('group', { name: 'Interview view' })).toBeInTheDocument();
        expect(screen.queryByRole('region', { name: 'Application board' })).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        expect(screen.getByRole('button', { name: /delete all interviews/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Export as CSV' })).toBeInTheDocument();
    });

    test('highlights the exact dashboard interview in List view without resaving the view preference', async () => {
        const updatePreferences = vi.fn();
        const scrollIntoView = vi.fn();
        Element.prototype.scrollIntoView = scrollIntoView;

        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/view', state: { dashboardInterviewId: 1 } }]}>
                <ViewInterview />
                <LocationStateProbe />
            </MemoryRouter>,
            { updatePreferences }
        );

        await screen.findByText(/abc pte ltd/i);

        expect(updatePreferences).not.toHaveBeenCalled();
        await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' }));
        expect(document.getElementById('1')?.className).toContain('highlighted');
        await waitFor(() => expect(screen.getByTestId('location-state')).toHaveTextContent('null'));
    });

    test('switches Board mode to List once before highlighting a dashboard interview', async () => {
        const boardPreferences = { ...mockPreferences, interview_view_mode: 'board' as const };
        const updatePreferences = vi.fn(async (updatedPreferences: UpdateUserPreferencesRequest) => ({
            ...boardPreferences,
            ...updatedPreferences,
        }));

        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/view', state: { dashboardInterviewId: 1 } }]}>
                <ViewInterview />
            </MemoryRouter>,
            { initialPreferences: boardPreferences, updatePreferences }
        );

        await waitFor(() => expect(updatePreferences).toHaveBeenCalledWith({ interview_view_mode: 'list' }));
        expect(updatePreferences).toHaveBeenCalledTimes(1);
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true')
        );
    });

    test('ignores invalid dashboard interview IDs without changing view mode', async () => {
        const updatePreferences = vi.fn();
        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/view', state: { dashboardInterviewId: -1 } }]}>
                <ViewInterview />
            </MemoryRouter>,
            { initialPreferences: { interview_view_mode: 'board' }, updatePreferences }
        );

        expect(await screen.findByText(/abc pte ltd/i)).toBeInTheDocument();
        expect(updatePreferences).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'true');
    });

    test('consumes a valid dashboard interview ID that is no longer present', async () => {
        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/view', state: { dashboardInterviewId: 99 } }]}>
                <ViewInterview />
                <LocationStateProbe />
            </MemoryRouter>
        );

        expect(await screen.findByText(/abc pte ltd/i)).toBeInTheDocument();
        await waitFor(() => expect(screen.getByTestId('location-state')).toHaveTextContent('null'));
    });

    test('shows the standard toast when dashboard List-mode switching fails', async () => {
        const updatePreferences = vi.fn().mockRejectedValue(new Error('save failed'));
        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/view', state: { dashboardInterviewId: 1 } }]}>
                <ViewInterview />
                <LocationStateProbe />
            </MemoryRouter>,
            { initialPreferences: { interview_view_mode: 'board' }, updatePreferences }
        );

        expect(await screen.findByText('Unable to save display preferences. Please try again.')).toBeInTheDocument();
        expect(screen.getByTestId('location-state')).toHaveTextContent('null');
    });

    test('shows a skeleton instead of a spinner during the initial fetch', () => {
        fetch.mockImplementation(async () => await new Promise<ReturnType<typeof response>>(() => undefined));

        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>
        );

        expect(screen.getAllByRole('status', { name: 'Loading results' })).toHaveLength(2);
        expect(screen.queryByRole('progressbar', { name: 'Loading' })).not.toBeInTheDocument();
        expect(screen.queryByText(/no job interview found/i)).not.toBeInTheDocument();
        expect(document.querySelector('br')).not.toBeInTheDocument();
    });

    test('deletes interview after user confirms', async () => {
        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>
        );

        await screen.findByText(/abc pte ltd/i);

        // Simulates user confirming delete
        mockConfirm.mockResolvedValueOnce({ confirmed: true });
        // Simulates user clicking delete button and clicking confirm delete
        await clickConfirmedAction(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() =>
            expect(mockConfirm).toHaveBeenCalledWith({
                title: 'Confirm Deletion',
                description:
                    'Are you sure you want to delete this job interview? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true },
            })
        );

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-interviews/1`, {
                method: 'DELETE',
            })
        );

        await waitFor(() => expect(screen.queryByText(/abc pte ltd/i)).not.toBeInTheDocument());
    });

    test('deletes all interviews after user confirms', async () => {
        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>
        );

        await screen.findByText(/abc pte ltd/i);

        // Simulates user confirming delete
        mockConfirm.mockResolvedValueOnce({ confirmed: true });
        // Simulates user clicking delete button and clicking confirm delete
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await clickConfirmedAction(screen.getByRole('button', { name: 'Delete all interviews' }));

        await waitFor(() =>
            expect(mockConfirm).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Confirm Delete All',
                    description:
                        'Delete all 1 active interview you own? This affects every active interview in your account. This action is permanent and cannot be undone.',
                    confirmationText: 'Delete All',
                    cancellationText: 'Cancel',
                    confirmationButtonProps: expect.objectContaining({
                        autoFocus: false,
                        onKeyDown: expect.any(Function),
                    }),
                })
            )
        );

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-interviews`, {
                method: 'DELETE',
            })
        );

        await waitFor(() => expect(screen.queryByText(/abc pte ltd/i)).not.toBeInTheDocument());
    });

    test('renders the interview empty state without filter actions', async () => {
        fetch.mockResolvedValue(response([]));

        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>
        );

        expect(await screen.findByRole('heading', { name: 'No interviews yet' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'No interviews yet' }).closest('section')?.className).toContain(
            'followsControls'
        );
        expect(screen.getByText(/add interviews after creating a job application/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View applications' })).toHaveAttribute('href', '/application/view');
        expect(screen.queryByRole('link', { name: 'Add interview' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    });

    test('shows error toast when corresponding job application is not available', async () => {
        fetch.mockResolvedValueOnce(response([mockInterview])).mockResolvedValueOnce(response([]));

        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>
        );

        await userEvent.click(await screen.findByRole('link', { name: /review corresponding job application/i }));

        expect(
            await screen.findByText(/this job application is not available in active applications/i)
        ).toBeInTheDocument();
    });

    test('renders only the responsive interview Board skeleton for a saved Board preference', () => {
        fetch.mockImplementation(async () => await new Promise<ReturnType<typeof response>>(() => undefined));

        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>,
            { initialPreferences: { interview_view_mode: 'board' } }
        );

        expect(screen.getByRole('status', { name: 'Loading interviews' })).toBeInTheDocument();
        expect(screen.getAllByTestId('skeleton-card')).toHaveLength(6);
        expect(screen.queryByRole('status', { name: 'Loading results' })).not.toBeInTheDocument();
        expect(screen.queryByRole('status', { name: 'Loading board' })).not.toBeInTheDocument();
    });

    test('switches the loaded array to Board without refetching or changing order', async () => {
        const secondInterview = { ...mockInterview, company_name: 'Second Company', interview_id: 2, job_id: 2 };
        fetch.mockResolvedValue(response([mockInterview, secondInterview]));

        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>
        );

        const list = await screen.findByRole('region', { name: 'Active interviews' });
        expect(
            within(list)
                .getAllByRole('article')
                .map((card) => card.getAttribute('aria-label'))
        ).toEqual(['ABC Pte Ltd interview', 'Second Company interview']);

        await userEvent.click(
            within(screen.getByRole('group', { name: 'Interview view' })).getByRole('button', {
                name: 'Board',
            })
        );

        await waitFor(() => expect(list).toHaveAttribute('data-layout', 'board'));
        expect(
            within(list)
                .getAllByRole('article')
                .map((card) => card.getAttribute('aria-label'))
        ).toEqual(['ABC Pte Ltd interview', 'Second Company interview']);
        expect(within(list).queryByText(/time left/i)).not.toBeInTheDocument();
        expect(within(list).queryByText(/notes:/i)).not.toBeInTheDocument();
        expect(
            within(list).queryByRole('link', { name: /review corresponding job application/i })
        ).not.toBeInTheDocument();
        expect(within(list).getAllByText('Actions')).toHaveLength(2);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('keeps the current view and shows the standard toast when saving the preference fails', async () => {
        const updatePreferences = vi.fn().mockRejectedValue(new Error('save failed'));
        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>,
            { updatePreferences }
        );

        await screen.findByText(/abc pte ltd/i);
        const viewToggle = screen.getByRole('group', { name: 'Interview view' });
        await userEvent.click(within(viewToggle).getByRole('button', { name: 'Board' }));

        expect(await screen.findByText('Unable to save display preferences. Please try again.')).toBeInTheDocument();
        expect(within(viewToggle).getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
        expect(within(viewToggle).getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'false');
    });

    test('blocks corresponding navigation before the API when applications use Board view', async () => {
        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>,
            { initialPreferences: { application_view_mode: 'board' } }
        );

        const link = await screen.findByRole('link', { name: /review corresponding job application/i });
        await userEvent.click(link);

        expect(
            await screen.findByText(
                'The corresponding job application can only be opened while active applications are displayed in List view. Switch to List view and try again.'
            )
        ).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});
