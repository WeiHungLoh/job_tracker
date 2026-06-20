import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ViewApplication from '../../pages/jobApplication/viewApplication/ViewApplication';
import { render } from '../renderWithToast';
import userEvent from '@testing-library/user-event';

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
            if (init?.method !== 'GET') return response(undefined, 204);
            if (url.endsWith('/job-interviews')) return response([]);
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
        expect(screen.queryByText(/no job application with that job status found/i)).not.toBeInTheDocument();
        expect(screen.getByText(/software engineer/i)).toBeInTheDocument();
        expect(screen.getByText(/job status/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /edit status/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add new application/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete all/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeInTheDocument();
        expect(screen.getByText(/unhide archive/i)).toBeInTheDocument();
        expect(screen.getByText(/filter by/i)).toBeInTheDocument();
        expect(screen.getByText(/unhide notes/i)).toBeInTheDocument();
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

    test('renders message for empty application list on successful fetch with no data', async () => {
        fetch.mockResolvedValue(response([]));

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        expect(await screen.findByText(/no job application with that job status found/i)).toBeInTheDocument();
    });

    test('deletes all application after user confirms', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);

        // Simulates user confirming delete
        mockConfirm.mockResolvedValueOnce({ confirmed: true });

        // Simulates user clicking delete button and clicking confirm delete
        userEvent.click(screen.getByRole('button', { name: 'Delete all applications' }));

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
