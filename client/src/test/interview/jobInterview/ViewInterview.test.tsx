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
    interview_duration_minutes: 60,
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
    interview_time_filters: ['Upcoming Interviews', 'Past Interviews'],
    archived_interview_time_filters: ['Upcoming Interviews', 'Past Interviews'],
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
const calendarMocks = vi.hoisted(() => ({ downloadBulkIcsEvents: vi.fn() }));
vi.mock('material-ui-confirm', () => ({
    useConfirm: () => mockConfirm,
}));
vi.mock('../../../pages/interview/calendarOptions/calendarEvent', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../../pages/interview/calendarOptions/calendarEvent')>()),
    downloadBulkIcsEvents: calendarMocks.downloadBulkIcsEvents,
}));

const clickConfirmedAction = async (button: HTMLElement) => {
    await act(async () => {
        await userEvent.click(button);
    });
};

const getExportCsvText = (): string => {
    const href = screen.getByRole('link', { name: 'Export as CSV' }).getAttribute('href') ?? '';
    const csvStart = href.indexOf(',');
    return decodeURIComponent(csvStart === -1 ? href : href.slice(csvStart + 1)).replace(/^\uFEFF/, '');
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

    test('restores upcoming visibility before highlighting a dashboard interview hidden by the Past filter', async () => {
        const futureInterview = {
            ...mockInterview,
            interview_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        };
        fetch.mockImplementation(async (url: string) =>
            url.endsWith('/job-interviews/summary') ? response({ interview_count: 1 }) : response([futureInterview])
        );
        const pastPreferences = {
            ...mockPreferences,
            interview_time_filters: ['Past Interviews'] as UserPreferences['interview_time_filters'],
        };
        const updatePreferences = vi.fn(async (updatedPreferences: UpdateUserPreferencesRequest) => ({
            ...pastPreferences,
            ...updatedPreferences,
        }));
        const scrollIntoView = vi.fn();
        Element.prototype.scrollIntoView = scrollIntoView;

        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/view', state: { dashboardInterviewId: 1 } }]}>
                <ViewInterview />
            </MemoryRouter>,
            { initialPreferences: pastPreferences, updatePreferences }
        );

        await waitFor(() =>
            expect(updatePreferences).toHaveBeenCalledWith({
                interview_time_filters: ['Upcoming Interviews', 'Past Interviews'],
            })
        );
        await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' }));
        expect(screen.getByRole('article', { name: 'ABC Pte Ltd interview' })).toBeInTheDocument();
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

    test('uses one filtered collection for display and CSV while bulk calendar and Delete All keep full scope', async () => {
        const now = Date.now();
        const interviews = [
            {
                ...mockInterview,
                company_name: 'Future Company',
                interview_date: new Date(now + 60 * 60 * 1000).toISOString(),
                interview_id: 1,
            },
            {
                ...mockInterview,
                company_name: 'In Progress Company',
                interview_date: new Date(now - 30 * 60 * 1000).toISOString(),
                interview_id: 2,
            },
            {
                ...mockInterview,
                company_name: 'Ended Company',
                interview_date: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
                interview_id: 3,
            },
        ];
        fetch.mockImplementation(async (url: string, init?: RequestInit) => {
            if (url.endsWith('/job-interviews/summary')) {
                return response({ interview_count: 3 });
            }
            return init?.method === 'GET' ? response(interviews) : response(undefined, 204);
        });
        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>
        );

        await screen.findByRole('article', { name: 'Future Company interview' });
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Upcoming Interviews' }));

        expect(await screen.findByRole('article', { name: 'Ended Company interview' })).toBeInTheDocument();
        expect(screen.queryByRole('article', { name: 'Future Company interview' })).not.toBeInTheDocument();
        expect(screen.queryByRole('article', { name: 'In Progress Company interview' })).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        const csv = getExportCsvText();
        expect(csv).toContain('Ended Company');
        expect(csv).not.toContain('Future Company');
        expect(csv).not.toContain('In Progress Company');
        expect(csv).toContain('Duration (minutes)');

        mockConfirm.mockResolvedValueOnce({ confirmed: false });
        await clickConfirmedAction(screen.getByRole('button', { name: 'Export upcoming interviews (.ics)' }));
        expect(mockConfirm).toHaveBeenLastCalledWith(
            expect.objectContaining({
                title: 'Export all upcoming interviews?',
                description:
                    'This will download one .ics file containing all 2 upcoming interviews, including interviews you may already have added to your calendar. Importing the file again may create duplicate calendar events.',
                confirmationText: 'Export All',
                cancellationText: 'Cancel',
            })
        );
        expect(calendarMocks.downloadBulkIcsEvents).not.toHaveBeenCalled();
        expect(screen.queryByText('Unable to create the calendar event. Please try again.')).not.toBeInTheDocument();

        mockConfirm.mockResolvedValueOnce({ confirmed: true });
        await clickConfirmedAction(screen.getByRole('button', { name: 'Export upcoming interviews (.ics)' }));
        expect(calendarMocks.downloadBulkIcsEvents).toHaveBeenCalledOnce();
        expect(calendarMocks.downloadBulkIcsEvents.mock.calls[0][0]).toHaveLength(2);

        calendarMocks.downloadBulkIcsEvents.mockImplementationOnce(() => {
            throw new Error('generation failed');
        });
        mockConfirm.mockResolvedValueOnce({ confirmed: true });
        await clickConfirmedAction(screen.getByRole('button', { name: 'Export upcoming interviews (.ics)' }));
        expect(await screen.findByText('Unable to create the calendar event. Please try again.')).toBeInTheDocument();

        mockConfirm.mockResolvedValueOnce({ confirmed: false });
        await clickConfirmedAction(screen.getByRole('button', { name: 'Delete all interviews' }));
        expect(mockConfirm).toHaveBeenLastCalledWith(
            expect.objectContaining({
                description:
                    'Delete all 3 active interviews you own? This affects every active interview in your account. This action is permanent and cannot be undone.',
            })
        );
    });

    test('shows filtered empty state, restores Show All, and rolls back a failed saved filter', async () => {
        const endedInterview = {
            ...mockInterview,
            company_name: 'Ended Company',
            interview_date: '2020-01-01T00:00:00Z',
        };
        fetch.mockResolvedValue(response([endedInterview]));

        const firstRender = render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>,
            { initialPreferences: { interview_time_filters: ['Upcoming Interviews'] } }
        );

        expect(await screen.findByRole('heading', { name: 'No interviews match your filters' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'More...' })).not.toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Interview view and management controls' }).children).toHaveLength(1);
        await userEvent.click(screen.getByRole('button', { name: 'Show all interviews' }));
        expect(await screen.findByRole('article', { name: 'Ended Company interview' })).toBeInTheDocument();
        firstRender.unmount();

        const updatePreferences = vi.fn(async (): Promise<UserPreferences> => {
            throw new Error('save failed');
        });
        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>,
            { updatePreferences }
        );
        await screen.findByRole('article', { name: 'Ended Company interview' });
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Upcoming Interviews' }));

        expect(await screen.findByText('Unable to save interview filters. Please try again.')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Upcoming Interviews' })).toBeChecked());
        expect(screen.getByRole('checkbox', { name: 'Past Interviews' })).toBeChecked();
        expect(screen.getByRole('article', { name: 'Ended Company interview' })).toBeInTheDocument();
    });

    test('disables bulk calendar export when no active interview has time remaining', async () => {
        fetch.mockResolvedValue(
            response([{ ...mockInterview, company_name: 'Past Company', interview_date: '2020-01-01T00:00:00Z' }])
        );

        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>
        );

        await screen.findByRole('article', { name: 'Past Company interview' });
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        expect(screen.getByRole('button', { name: 'Export upcoming interviews (.ics)' })).toBeDisabled();
    });
});
