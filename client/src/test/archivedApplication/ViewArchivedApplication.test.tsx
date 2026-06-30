import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ViewArchivedApplication from '../../pages/archivedApplication/viewArchivedApplication/ViewArchivedApplication';
import { render } from '../renderWithToast';
import userEvent from '@testing-library/user-event';
import { JOB_STATUSES } from '../../pages/jobApplication/models';

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
    archived_application_job_statuses: [...JOB_STATUSES],
    archived_application_show_notes: false,
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
        expect(screen.getByRole('button', { name: /delete all archived applications/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeInTheDocument();
        expect(screen.getByText(/filter by/i)).toBeInTheDocument();
        expect(screen.getByText(/unhide notes/i)).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith(
            `${
                import.meta.env.VITE_API_URL
            }/archived-job-applications?jobStatuses=Accepted&jobStatuses=Applied&jobStatuses=Declined&jobStatuses=Ghosted&jobStatuses=Interview&jobStatuses=Offer&jobStatuses=Rejected`,
            {
                method: 'GET',
                credentials: 'include',
            }
        );
    });

    test('fetches archived applications from the server when the status filter changes', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Job status' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Offer' }));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(
                `${import.meta.env.VITE_API_URL}/archived-job-applications?jobStatuses=Offer`,
                {
                    method: 'GET',
                    credentials: 'include',
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
        await userEvent.click(screen.getByRole('button', { name: 'Job status' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Offer' }));

        const filterButton = screen.getByRole('button', { name: 'Job status' });
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
                credentials: 'include',
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
        userEvent.click(screen.getByRole('button', { name: /delete all archived applications/i }));

        await waitFor(() =>
            expect(mockConfirm).toHaveBeenCalledWith({
                title: 'Confirm Deletion',
                description:
                    'Are you sure you want to delete all archived job applications? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            })
        );

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/archived-job-applications`, {
                method: 'DELETE',
                credentials: 'include',
            })
        );

        await waitFor(() => expect(screen.queryByText(/ABC Pte Ltd/i)).not.toBeInTheDocument());
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
                credentials: 'include',
            })
        );
        await waitFor(() => expect(screen.queryByText(/ABC Pte Ltd/i)).not.toBeInTheDocument());
    });

    test('renders message for empty application list on successful fetch with no data', async () => {
        fetch.mockResolvedValue(response([]));

        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        );

        expect(
            await screen.findByText(/no archived job applications match the selected job statuses/i)
        ).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Job status' }));
        expect(screen.getByRole('checkbox', { name: 'Show All' })).toBeVisible();
        expect(screen.getByRole('checkbox', { name: 'Accepted' })).toBeVisible();
    });
});
