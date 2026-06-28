import { screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ViewApplication from '../../pages/jobApplication/viewApplication/ViewApplication';
import { render } from '../renderWithToast';
import userEvent from '@testing-library/user-event';
import { JOB_STATUSES } from '../../pages/jobApplication/models';

globalThis.fetch = vi.fn();

const mockApplication = {
    job_id: 1,
    company_name: 'ABC Pte Ltd',
    job_title: 'Software Engineer',
    job_location: 'Remote',
    application_date: '2025-06-20T00:00:00Z',
    job_status: 'Applied',
    edit_status: false,
    job_posting_url: 'https://jobstreet.com',
    notes: '',
};

const mockPreferences = {
    user_id: 1,
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

globalThis.alert = vi.fn();

describe('Job application viewing flow', () => {
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
            if (init?.method !== 'GET') {
                return response(undefined, 204);
            }
            if (url.endsWith('/job-interviews')) {
                return response([]);
            }
            return response([mockApplication]);
        });
    });

    test('displays job application details and action buttons', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );
        expect(await screen.findByText(/ABC Pte Ltd/i)).toBeInTheDocument();
        expect(screen.queryByText(/no job applications match the selected job statuses/i)).not.toBeInTheDocument();
        expect(screen.getByText(/software engineer/i)).toBeInTheDocument();
        expect(screen.getByText(/^job status:/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /edit status/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete all applications/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeInTheDocument();
        expect(screen.getByText(/unhide archive/i)).toBeInTheDocument();
        expect(screen.getByText(/filter by/i)).toBeInTheDocument();
        expect(screen.getByText(/unhide notes/i)).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith(
            `${
                import.meta.env.VITE_API_URL
            }/job-applications?jobStatuses=Accepted&jobStatuses=Applied&jobStatuses=Declined&jobStatuses=Ghosted&jobStatuses=Interview&jobStatuses=Offer&jobStatuses=Rejected`,
            {
                method: 'GET',
                credentials: 'include',
            }
        );
    });

    test('fetches applications from the server when the status filter changes', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Job status' }));

        const callsBeforeTogglingShowAll = fetch.mock.calls.length;
        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));
        expect(fetch).toHaveBeenCalledTimes(callsBeforeTogglingShowAll);

        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));
        expect(fetch).toHaveBeenCalledTimes(callsBeforeTogglingShowAll);

        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));

        const callsBeforeSelectingOffer = fetch.mock.calls.length;
        await userEvent.click(screen.getByRole('checkbox', { name: 'Offer' }));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-applications?jobStatuses=Offer`, {
                method: 'GET',
                credentials: 'include',
            })
        );
        expect(fetch.mock.calls.length).toBeGreaterThan(callsBeforeSelectingOffer);

        await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Accepted' })).not.toBeDisabled());
        await userEvent.click(screen.getByRole('checkbox', { name: 'Accepted' }));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(
                `${import.meta.env.VITE_API_URL}/job-applications?jobStatuses=Offer&jobStatuses=Accepted`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            )
        );

        await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Accepted' })).not.toBeDisabled());
        const callsBeforeRemovingAccepted = fetch.mock.calls.length;
        await userEvent.click(screen.getByRole('checkbox', { name: 'Accepted' }));
        await waitFor(() => expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(callsBeforeRemovingAccepted + 1));

        await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Offer' })).not.toBeDisabled());
        const callsBeforeClearingFinalStatus = fetch.mock.calls.length;
        await userEvent.click(screen.getByRole('checkbox', { name: 'Offer' }));

        await waitFor(() => expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(callsBeforeClearingFinalStatus + 1));
        expect(screen.getByRole('checkbox', { name: 'Show All' })).toBeChecked();
        expect(fetch).toHaveBeenCalledWith(
            `${
                import.meta.env.VITE_API_URL
            }/job-applications?jobStatuses=Accepted&jobStatuses=Applied&jobStatuses=Declined&jobStatuses=Ghosted&jobStatuses=Interview&jobStatuses=Offer&jobStatuses=Rejected`,
            {
                method: 'GET',
                credentials: 'include',
            }
        );
    });

    test('keeps filter checkboxes enabled while applications are loading', async () => {
        let resolveFilterRequest: ((value: ReturnType<typeof response>) => void) | undefined;
        const pendingFilterRequest = new Promise<ReturnType<typeof response>>((resolve) => {
            resolveFilterRequest = resolve;
        });

        fetch.mockImplementation(async (url: string) => {
            if (url.endsWith('/job-interviews')) {
                return response([]);
            }
            if (url.endsWith('/job-applications?jobStatuses=Offer')) {
                return await pendingFilterRequest;
            }
            return response([mockApplication]);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Job status' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Offer' }));

        expect(screen.getByRole('checkbox', { name: 'Accepted' })).not.toBeDisabled();
        expect(screen.getByRole('checkbox', { name: 'Offer' })).not.toBeDisabled();
        expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();

        resolveFilterRequest?.(response([mockApplication]));

        await waitFor(() => expect(screen.queryByRole('progressbar', { name: 'Loading' })).not.toBeInTheDocument());
    });

    test('restores the saved filter and shows the backend message when filtering fails', async () => {
        fetch.mockImplementation(async (url: string, init?: RequestInit) => {
            if (url.endsWith('/user-preferences')) {
                return response({
                    ...mockPreferences,
                    ...(init?.body ? JSON.parse(String(init.body)) : {}),
                });
            }
            if (url.endsWith('/job-interviews')) {
                return response([]);
            }
            if (url.endsWith('/job-applications?jobStatuses=Offer')) {
                return response({ message: 'Job application filtering is temporarily unavailable.' }, 503);
            }
            return response([mockApplication]);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Job status' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Offer' }));

        expect(await screen.findByText('Job application filtering is temporarily unavailable.')).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Show All' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Offer' })).toBeChecked();
    });

    test('button should switch to Save Changes button after toggle', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);

        userEvent.click(screen.getByRole('button', { name: /edit status/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-applications/1/edit-status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ editStatus: true }),
            });
        });

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByRole('listbox')).toBeInTheDocument();
        });
    });

    test('restores database ordering after changing an application status', async () => {
        const applications = [
            {
                ...mockApplication,
                job_id: 3,
                company_name: 'Offer Pte Ltd',
                job_status: 'Offer',
                application_date: '2025-06-19T00:00:00Z',
            },
            mockApplication,
            {
                ...mockApplication,
                job_id: 2,
                company_name: 'XYZ Pte Ltd',
                job_status: 'Rejected',
                application_date: '2025-06-21T00:00:00Z',
            },
        ];
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
            if (url.endsWith('/job-interviews')) {
                return response([]);
            }
            return response(applications);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/XYZ Pte Ltd/i);
        userEvent.click(screen.getAllByRole('button', { name: /edit status/i })[2]);
        userEvent.selectOptions(await screen.findByRole('listbox'), 'Offer');
        userEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            const companyHeadings = screen.getAllByRole('heading', { level: 2 });
            expect(companyHeadings[0]).toHaveTextContent('1. XYZ Pte Ltd');
            expect(companyHeadings[1]).toHaveTextContent('2. Offer Pte Ltd');
            expect(companyHeadings[2]).toHaveTextContent('3. ABC Pte Ltd');
        });
    });

    test('deletes application after user confirms', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
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
                    'Are you sure you want to delete this job application? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true },
            })
        );

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-applications/1`, {
                method: 'DELETE',
                credentials: 'include',
            })
        );

        await waitFor(() => expect(screen.queryByText(/ABC Pte Ltd/i)).not.toBeInTheDocument());
    });

    test('archives an application with PATCH', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(within(screen.getByTestId('unhide-archive')).getByRole('button'));
        await userEvent.click(screen.getByRole('button', { name: 'Archive' }));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/archived-job-applications`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: 1 }),
            })
        );
        await waitFor(() => expect(screen.queryByText(/ABC Pte Ltd/i)).not.toBeInTheDocument());
    });

    test('limits application notes to 3000 characters', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        const notesToggle = screen.getByText('Unhide Notes').parentElement;
        expect(notesToggle).not.toBeNull();
        await userEvent.click(within(notesToggle as HTMLElement).getByRole('button'));

        expect(screen.getByPlaceholderText('Add your notes here')).toHaveAttribute('maxlength', '3000');
    });

    test('renders message for empty application list on successful fetch with no data', async () => {
        fetch.mockResolvedValue(response([]));

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        expect(await screen.findByText(/no job applications match the selected job statuses/i)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Job status' }));
        expect(screen.getByRole('checkbox', { name: 'Show All' })).toBeVisible();
        expect(screen.getByRole('checkbox', { name: 'Accepted' })).toBeVisible();
    });

    test('deletes all applications after user confirms', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);

        // Simulates user confirming delete
        mockConfirm.mockResolvedValueOnce({ confirmed: true });

        // Simulates user clicking delete button and clicking confirm delete
        userEvent.click(screen.getByRole('button', { name: /delete all applications/i }));

        await waitFor(() =>
            expect(mockConfirm).toHaveBeenCalledWith({
                title: 'Confirm Deletion',
                description:
                    'Are you sure you want to delete all job applications? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            })
        );

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-applications`, {
                method: 'DELETE',
                credentials: 'include',
            })
        );

        await waitFor(() => expect(screen.queryByText(/ABC Pte Ltd/i)).not.toBeInTheDocument());
    });
});
