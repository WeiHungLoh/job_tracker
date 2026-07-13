import { act, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ViewArchivedInterview from '../../../pages/interview/archivedInterview/viewArchivedInterview/ViewArchivedInterview';
import { render } from '../../renderWithToast';
import userEvent from '@testing-library/user-event';

globalThis.fetch = vi.fn();

const mockInterview = {
    archived_job_id: 1,
    archived_interview_id: 1,
    company_name: 'ABC Pte Ltd',
    job_title: 'Software Engineer',
    job_status: 'Applied',
    interview_location: 'Changi Business Park',
    interview_type: 'HR',
    interview_notes: 'Bring resume',
    interview_date: '2025-06-20T00:00:00Z',
    interview_duration_minutes: 60,
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

const getExportCsvText = (): string => {
    const href = screen.getByRole('link', { name: 'Export as CSV' }).getAttribute('href') ?? '';
    const csvStart = href.indexOf(',');
    return decodeURIComponent(csvStart === -1 ? href : href.slice(csvStart + 1)).replace(/^\uFEFF/, '');
};

describe('Archived job interview viewer flow', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        fetch.mockReset();
        fetch.mockImplementation(async (url: string, init?: RequestInit) => {
            if (url.endsWith('/archived-job-interviews/summary')) {
                return response({ interview_count: 1 });
            }
            return init?.method === 'GET' ? response([mockInterview]) : response(undefined, 204);
        });
    });

    test('displays job interview details and action buttons', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>
        );

        expect(await screen.findByText(/abc pte ltd/i)).toBeInTheDocument();
        expect(screen.queryByText(/no job interview found/)).not.toBeInTheDocument();
        expect(screen.getByText(/software engineer/i)).toBeInTheDocument();
        expect(screen.getByText(/changi business park/i)).toBeInTheDocument();
        expect(screen.getByText(/hr/i)).toBeInTheDocument();
        expect(screen.getByText(/bring resume/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        expect(screen.getByRole('button', { name: /delete all archived interviews/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Export as CSV' })).toBeInTheDocument();
    });

    test('shows a skeleton instead of a spinner during the initial fetch', () => {
        fetch.mockImplementation(async () => await new Promise<ReturnType<typeof response>>(() => undefined));

        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>
        );

        expect(screen.getAllByRole('status', { name: 'Loading results' })).toHaveLength(2);
        expect(screen.queryByRole('progressbar', { name: 'Loading' })).not.toBeInTheDocument();
        expect(screen.queryByText(/no archived job interview found/i)).not.toBeInTheDocument();
        expect(document.querySelector('br')).not.toBeInTheDocument();
    });

    test('deletes archived interview after user confirms', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedInterview />
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
                    'Are you sure you want to delete this archived job interview? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true },
            })
        );

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/archived-job-interviews/1`, {
                method: 'DELETE',
            })
        );

        await waitFor(() => expect(screen.queryByText(/abc pte ltd/i)).not.toBeInTheDocument());
    });

    test('deletes all archived interviews after user confirms', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>
        );

        await screen.findByText(/abc pte ltd/i);

        // Simulates user confirming delete
        mockConfirm.mockResolvedValueOnce({ confirmed: true });
        // Simulates user clicking delete button and clicking confirm delete
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await clickConfirmedAction(screen.getByRole('button', { name: 'Delete all archived interviews' }));

        await waitFor(() =>
            expect(mockConfirm).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Confirm Delete All',
                    description:
                        'Delete all 1 archived interview you own? This affects every archived interview in your account. This action is permanent and cannot be undone.',
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
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/archived-job-interviews`, {
                method: 'DELETE',
            })
        );

        await waitFor(() => expect(screen.queryByText(/abc pte ltd/i)).not.toBeInTheDocument());
    });

    test('renders the archived interview empty state without filter actions', async () => {
        fetch.mockResolvedValue(response([]));

        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>
        );

        expect(await screen.findByRole('heading', { name: 'No archived interviews yet' })).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'No archived interviews yet' }).closest('section')?.className
        ).toContain('followsControls');
        expect(screen.getByText(/interviews linked to archived applications/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View active interviews' })).toHaveAttribute('href', '/interview/view');
        expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    });

    test('shows error toast when corresponding archived job application is not available', async () => {
        fetch.mockResolvedValueOnce(response([mockInterview])).mockResolvedValueOnce(response([]));

        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>
        );

        await userEvent.click(await screen.findByRole('link', { name: /review corresponding job application/i }));

        expect(
            await screen.findByText(/this archived job application is not available in archived applications/i)
        ).toBeInTheDocument();
    });

    test('renders only the archived interview Board skeleton for a saved Board preference', () => {
        fetch.mockImplementation(async () => await new Promise<ReturnType<typeof response>>(() => undefined));

        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>,
            { initialPreferences: { archived_interview_view_mode: 'board' } }
        );

        expect(screen.getByRole('status', { name: 'Loading interviews' })).toBeInTheDocument();
        expect(screen.getAllByTestId('skeleton-card')).toHaveLength(6);
        expect(screen.queryByRole('status', { name: 'Loading results' })).not.toBeInTheDocument();
        expect(screen.queryByRole('status', { name: 'Loading board' })).not.toBeInTheDocument();
    });

    test('switches archived interviews to Board without refetching', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>
        );

        const interviews = await screen.findByRole('region', { name: 'Archived interviews' });
        await userEvent.click(
            within(screen.getByRole('group', { name: 'Archived interview view' })).getByRole('button', {
                name: 'Board',
            })
        );

        await waitFor(() => expect(interviews).toHaveAttribute('data-layout', 'board'));
        expect(within(interviews).queryByText(/time left/i)).not.toBeInTheDocument();
        expect(within(interviews).queryByText(/notes:/i)).not.toBeInTheDocument();
        expect(
            within(interviews).queryByRole('link', { name: /review corresponding job application/i })
        ).not.toBeInTheDocument();
        const actions = within(interviews).getByText('Actions').closest('details');
        expect(actions).not.toHaveAttribute('open');

        await userEvent.click(within(interviews).getByText('Actions'));
        expect(actions).toHaveAttribute('open');
        expect(within(interviews).getByRole('button', { name: 'Delete' }).parentElement?.className).toContain(
            'compactActions'
        );
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('blocks archived corresponding navigation before the API when archived applications use Board view', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>,
            {
                initialPreferences: {
                    archived_application_view_mode: 'board',
                },
            }
        );

        await userEvent.click(await screen.findByRole('link', { name: /review corresponding job application/i }));

        expect(
            await screen.findByText(
                'The corresponding archived job application can only be opened while archived applications are displayed in List view. Switch to List view and try again.'
            )
        ).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('filters archived Board display and exports CSV from the same collection', async () => {
        const now = Date.now();
        const interviews = [
            {
                ...mockInterview,
                archived_interview_id: 1,
                company_name: 'Future Archived Company',
                interview_date: new Date(now + 60 * 60 * 1000).toISOString(),
            },
            {
                ...mockInterview,
                archived_interview_id: 2,
                company_name: 'Ended Archived Company',
                interview_date: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
            },
        ];
        fetch.mockResolvedValue(response(interviews));

        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>,
            {
                initialPreferences: {
                    archived_interview_time_filters: ['Past Interviews'],
                    archived_interview_view_mode: 'board',
                },
            }
        );

        const board = await screen.findByRole('region', { name: 'Archived interviews' });
        expect(board).toHaveAttribute('data-layout', 'board');
        expect(within(board).getByRole('article', { name: 'Ended Archived Company interview' })).toBeInTheDocument();
        expect(
            within(board).queryByRole('article', { name: 'Future Archived Company interview' })
        ).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        const csv = getExportCsvText();
        expect(csv).toContain('Ended Archived Company');
        expect(csv).not.toContain('Future Archived Company');
        expect(screen.queryByRole('button', { name: 'Export upcoming interviews (.ics)' })).not.toBeInTheDocument();
    });
});
