import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ViewInterview from '../../pages/interview/viewInterview/ViewInterview';
import { render } from '../renderWithToast';
import userEvent from '@testing-library/user-event';

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

describe('Job interview viewer flow', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        fetch.mockReset();
        fetch.mockImplementation(async (_url: string, init?: RequestInit) =>
            init?.method === 'GET' ? response([mockInterview]) : response(undefined, 204)
        );
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
        expect(screen.getByRole('button', { name: /delete all interviews/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeInTheDocument();
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
        userEvent.click(screen.getByRole('button', { name: 'Delete' }));

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
                credentials: 'include',
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
        userEvent.click(screen.getByRole('button', { name: 'Delete all interviews' }));

        await waitFor(() =>
            expect(mockConfirm).toHaveBeenCalledWith({
                title: 'Confirm Deletion',
                description:
                    'Are you sure you want to delete all job interviews? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            })
        );

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-interviews`, {
                method: 'DELETE',
                credentials: 'include',
            })
        );

        await waitFor(() => expect(screen.queryByText(/abc pte ltd/i)).not.toBeInTheDocument());
    });

    test('renders message for empty interview list on successful fetch with no data', async () => {
        fetch.mockResolvedValue(response([]));

        render(
            <MemoryRouter>
                <ViewInterview />
            </MemoryRouter>
        );

        expect(await screen.findByText(/no job interview found/i)).toBeInTheDocument();
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
});
