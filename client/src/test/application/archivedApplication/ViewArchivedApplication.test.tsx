import { act, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ViewArchivedApplication from '../../../pages/application/archivedApplication/viewArchivedApplication/ViewArchivedApplication';
import { render } from '../../renderWithToast';
import userEvent from '@testing-library/user-event';
import { JOB_STATUSES } from '../../../pages/application/models';
import { routes } from '../../../routes';

globalThis.fetch = vi.fn();

const mockApplication = {
    archived_job_id: 1,
    company_name: 'ABC Pte Ltd',
    job_title: 'Software Engineer',
    job_location: 'Remote',
    application_date: '2025-06-20T00:00:00Z',
    job_status: 'Applied',
    job_posting_url: 'https://jobstreet.com',
    notes: '',
};

const mockPreferences = {
    application_job_statuses: [...JOB_STATUSES],
    application_show_notes: false,
    application_show_archive: false,
    application_enable_scroll: false,
    application_view_mode: 'list',
    archived_application_job_statuses: [...JOB_STATUSES],
    archived_application_show_notes: false,
    archived_application_view_mode: 'list',
    interview_view_mode: 'list',
    archived_interview_view_mode: 'list',
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

describe('Archived job application viewing flow', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        fetch.mockReset();
        fetch.mockImplementation(async (url: string, init?: RequestInit) => {
            if (url.endsWith('/user-preferences')) {
                return response({
                    ...mockPreferences,
                    ...(init?.body ? JSON.parse(String(init.body)) : {}),
                });
            }
            if (url.endsWith('/archived-job-applications/summary')) {
                return response({ application_count: 1, related_interview_count: 0 });
            }
            return init?.method === 'GET' ? response([mockApplication]) : response(undefined, 204);
        });
    });

    test('displays archived job application details and action buttons', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        expect(await screen.findByText(/ABC Pte Ltd/i)).toBeInTheDocument();
        expect(
            screen.queryByText(/no archived job applications match the selected job statuses/i)
        ).not.toBeInTheDocument();
        expect(screen.getByText(/software engineer/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /unarchive/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Filter by' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.queryByRole('region', { name: 'Archived application board' })).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Display options' }));
        expect(screen.getByRole('switch', { name: 'Show notes' })).toHaveAttribute('aria-checked', 'false');
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        expect(screen.getByRole('button', { name: /delete all archived applications/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /unarchive all applications/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Export as CSV' })).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith(
            `${
                import.meta.env.VITE_API_URL
            }/archived-job-applications?jobStatuses=Accepted&jobStatuses=Applied&jobStatuses=Declined&jobStatuses=Ghosted&jobStatuses=Interview&jobStatuses=Offer&jobStatuses=Rejected`,
            {
                method: 'GET',
            }
        );
    });

    test('switches to board view with read-only archived application cards', async () => {
        fetch.mockImplementation(async (url: string, init?: RequestInit) => {
            if (url.endsWith('/user-preferences')) {
                return response({
                    ...mockPreferences,
                    ...(init?.body ? JSON.parse(String(init.body)) : {}),
                });
            }
            if (init?.method !== 'GET') {
                return response(undefined, 204);
            }
            return response([
                mockApplication,
                {
                    ...mockApplication,
                    archived_job_id: 2,
                    company_name: 'Offer Pte Ltd',
                    job_status: 'Offer',
                },
            ]);
        });

        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Board' }));

        const board = screen.getByRole('region', { name: 'Archived application board' });
        expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.queryByRole('button', { name: 'Display options' })).not.toBeInTheDocument();
        expect(
            within(board)
                .getAllByRole('heading', { level: 2 })
                .map((heading) => heading.textContent)
        ).toEqual(['Accepted 0', 'Offer 1', 'Declined 0', 'Interview 0', 'Applied 1', 'Ghosted 0', 'Rejected 0']);

        const applicationCard = within(board).getByRole('article', { name: /ABC Pte Ltd Software Engineer/i });
        expect(within(applicationCard).getByText('20 Jun 2025')).toBeInTheDocument();
        expect(within(applicationCard).queryByText('Remote')).not.toBeInTheDocument();
        expect(within(applicationCard).queryByRole('combobox', { name: /move/i })).not.toBeInTheDocument();
        expect(within(applicationCard).queryByText('Edit notes')).not.toBeInTheDocument();
        expect(within(applicationCard).queryByPlaceholderText('Add your notes here')).not.toBeInTheDocument();

        await userEvent.click(within(applicationCard).getByText('Actions'));

        expect(within(applicationCard).getByRole('link', { name: 'Open job posting' })).toBeInTheDocument();
        expect(within(applicationCard).getByRole('button', { name: 'Unarchive' })).toBeInTheDocument();
        expect(within(applicationCard).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    test('shows archived board notes as read-only when enabled', async () => {
        fetch.mockImplementation(async (_url: string, init?: RequestInit) =>
            init?.method === 'GET'
                ? response([{ ...mockApplication, notes: 'Follow up after cooling period.' }])
                : response(undefined, 204)
        );

        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Display options' }));
        await userEvent.click(screen.getByRole('switch', { name: 'Show notes' }));
        await userEvent.click(screen.getByRole('button', { name: 'Board' }));

        const applicationCard = screen.getByRole('article', { name: /ABC Pte Ltd Software Engineer/i });
        await userEvent.click(within(applicationCard).getByText('Actions'));

        expect(within(applicationCard).getByText('Notes')).toBeInTheDocument();
        expect(within(applicationCard).getByDisplayValue('Follow up after cooling period.')).toBeDisabled();
        expect(within(applicationCard).queryByText('Edit notes')).not.toBeInTheDocument();
    });

    test('uses user preferences for the selected archived application view', async () => {
        const { unmount } = render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>,
            { initialPreferences: { archived_application_view_mode: 'board' } }
        );

        await screen.findByRole('region', { name: 'Archived application board' });
        expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'true');

        unmount();
        fetch.mockClear();

        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.queryByRole('region', { name: 'Archived application board' })).not.toBeInTheDocument();
    });

    test('fetches archived applications from the server when the status filter changes', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Offer' }));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(
                `${import.meta.env.VITE_API_URL}/archived-job-applications?jobStatuses=Offer`,
                {
                    method: 'GET',
                }
            )
        );
    });

    test('shows controls above the skeleton while archived applications are filtering', async () => {
        let resolveFilterRequest: ((value: ReturnType<typeof response>) => void) | undefined;
        const pendingFilterRequest = new Promise<ReturnType<typeof response>>((resolve) => {
            resolveFilterRequest = resolve;
        });

        fetch.mockImplementation(async (url: string) => {
            if (url.endsWith('/archived-job-applications?jobStatuses=Offer')) {
                return await pendingFilterRequest;
            }

            return response([mockApplication]);
        });

        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Offer' }));

        const filterButton = screen.getByRole('button', { name: 'Filter by' });
        const skeletons = screen.getAllByRole('status', { name: 'Loading results' });

        expect(skeletons).toHaveLength(2);
        expect(filterButton.compareDocumentPosition(skeletons[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(filterButton).not.toBeDisabled();
        expect(screen.queryByText(/ABC Pte Ltd/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('progressbar', { name: 'Loading' })).not.toBeInTheDocument();

        resolveFilterRequest?.(response([mockApplication]));

        await waitFor(() => expect(screen.queryAllByRole('status', { name: 'Loading results' })).toHaveLength(0));
        expect(screen.getByText(/ABC Pte Ltd/i)).toBeInTheDocument();
    });

    test('shows the board skeleton during the initial fetch in board view', async () => {
        fetch.mockImplementation(async () => await new Promise<ReturnType<typeof response>>(() => undefined));

        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>,
            { initialPreferences: { archived_application_view_mode: 'board' } }
        );

        expect(await screen.findByRole('status', { name: 'Loading board' })).toBeInTheDocument();
        expect(screen.getAllByTestId('skeleton-board-column')).toHaveLength(4);
        expect(screen.queryAllByRole('status', { name: 'Loading results' })).toHaveLength(0);
    });

    test('deletes application after user confirms', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);

        // Simulates user confirming delete
        mockConfirm.mockResolvedValueOnce({ confirmed: true });

        // Simulates user clicking delete button and clicking confirm delete
        userEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() =>
            expect(mockConfirm).toHaveBeenCalledWith({
                title: 'Confirm Deletion',
                description:
                    'Are you sure you want to delete this archived job application? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true },
            })
        );

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/archived-job-applications/1`, {
                method: 'DELETE',
            })
        );

        await waitFor(() => expect(screen.queryByText(/ABC Pte Ltd/i)).not.toBeInTheDocument());
    });

    test('deletes all archived applications after user confirms', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);

        // Simulates user confirming delete
        mockConfirm.mockResolvedValueOnce({ confirmed: true });

        // Simulates user clicking delete button and clicking confirm delete
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await clickConfirmedAction(screen.getByRole('button', { name: /delete all archived applications/i }));

        await waitFor(() =>
            expect(mockConfirm).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Confirm Delete All',
                    description:
                        'Delete all 1 archived job application and its 0 related archived interviews? This affects every archived application you own, including applications not visible under the current archived job-status filters. This action is permanent and cannot be undone.',
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
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/archived-job-applications`, {
                method: 'DELETE',
            })
        );

        await waitFor(() => expect(screen.queryByText(/ABC Pte Ltd/i)).not.toBeInTheDocument());
    });

    test('unarchives the complete archived collection with current counts', async () => {
        fetch.mockImplementation(async (url: string, init?: RequestInit) => {
            if (url.endsWith('/archived-job-applications/summary')) {
                return response({ application_count: 5, related_interview_count: 2 });
            }
            return init?.method === 'GET' ? response([mockApplication]) : response(undefined, 204);
        });
        mockConfirm.mockResolvedValueOnce({ confirmed: true });

        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );
        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await clickConfirmedAction(screen.getByRole('button', { name: 'Unarchive all applications' }));

        expect(mockConfirm).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Confirm Unarchive All',
                description:
                    'Unarchive all 5 archived job applications and their 2 related archived interviews? This affects every archived application you own, including applications not visible under the current archived job-status filters.',
            })
        );
        expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/archived-job-applications/unarchive-all`, {
            method: 'PATCH',
        });
        expect(await screen.findByRole('heading', { name: 'No archived applications yet' })).toBeInTheDocument();
    });

    test('unarchive job application', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        expect(await screen.findByText(/ABC Pte Ltd/i)).toBeInTheDocument();

        userEvent.click(screen.getByRole('button', { name: /unarchive/i }));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/archived-job-applications/1/restore`, {
                method: 'PATCH',
            })
        );
        await waitFor(() => expect(screen.queryByText(/ABC Pte Ltd/i)).not.toBeInTheDocument());
    });

    test('renders the archived application empty state with no data', async () => {
        fetch.mockResolvedValue(response([]));

        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        expect(await screen.findByRole('heading', { name: 'No archived applications yet' })).toBeInTheDocument();
        expect(screen.getByText(/archive applications you no longer need/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View active applications' })).toHaveAttribute(
            'href',
            '/application/view'
        );
        expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        expect(screen.getByRole('checkbox', { name: 'Show All' })).toBeVisible();
        expect(screen.getByRole('checkbox', { name: 'Accepted' })).toBeVisible();
    });

    test('clears archived application filters, saves all statuses, and refreshes list results', async () => {
        fetch.mockImplementation(async (url: string) =>
            url.includes('jobStatuses=Accepted') ? response([mockApplication]) : response([])
        );

        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>,
            { initialPreferences: { archived_application_job_statuses: ['Offer'] } }
        );

        expect(
            await screen.findByRole('heading', { name: 'No archived applications match your filters' })
        ).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

        expect(await screen.findByText(/ABC Pte Ltd/i)).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith(
            `${
                import.meta.env.VITE_API_URL
            }/archived-job-applications?jobStatuses=Accepted&jobStatuses=Applied&jobStatuses=Declined&jobStatuses=Ghosted&jobStatuses=Interview&jobStatuses=Offer&jobStatuses=Rejected`,
            { method: 'GET' }
        );
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        expect(screen.getByRole('checkbox', { name: 'Show All' })).toBeChecked();
    });

    test('clears archived application filters and refreshes board results', async () => {
        fetch.mockImplementation(async (url: string) =>
            url.includes('jobStatuses=Accepted') ? response([mockApplication]) : response([])
        );

        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>,
            {
                initialPreferences: {
                    archived_application_job_statuses: ['Offer'],
                    archived_application_view_mode: 'board',
                },
            }
        );

        expect(
            await screen.findByRole('heading', { name: 'No archived applications match your filters' })
        ).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

        const board = await screen.findByRole('region', { name: 'Archived application board' });
        expect(within(board).getByRole('article', { name: /ABC Pte Ltd Software Engineer/i })).toBeInTheDocument();
    });

    test('renders the archived application empty state inside board layout', async () => {
        fetch.mockResolvedValue(response([]));

        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>,
            { initialPreferences: { archived_application_view_mode: 'board' } }
        );

        expect(await screen.findByRole('heading', { name: 'No archived applications yet' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View active applications' })).toHaveAttribute(
            'href',
            '/application/view'
        );
        expect(screen.queryByRole('region', { name: 'Archived application board' })).not.toBeInTheDocument();
    });

    test('does not run hash scroll-and-highlight while archived applications use Board view', async () => {
        const scrollIntoView = vi.fn();
        HTMLElement.prototype.scrollIntoView = scrollIntoView;

        render(
            <MemoryRouter initialEntries={[`${routes.archivedApplications}#1`]}>
                <ViewArchivedApplication />
            </MemoryRouter>,
            { initialPreferences: { archived_application_view_mode: 'board' } }
        );

        expect(await screen.findByRole('region', { name: 'Archived application board' })).toBeInTheDocument();
        expect(scrollIntoView).not.toHaveBeenCalled();
    });

    test('keeps archived hash scroll-and-highlight in List view', async () => {
        const scrollIntoView = vi.fn();
        HTMLElement.prototype.scrollIntoView = scrollIntoView;

        render(
            <MemoryRouter initialEntries={[`${routes.archivedApplications}#1`]}>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        await waitFor(() => expect(scrollIntoView).toHaveBeenCalledOnce());
    });
});
