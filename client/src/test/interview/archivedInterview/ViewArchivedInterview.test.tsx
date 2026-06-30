import { screen, waitFor } from '@testing-library/react';
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

describe('Archived job interview viewer flow', () => {
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
        expect(screen.getByRole('button', { name: /delete all archived interviews/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeInTheDocument();
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
        userEvent.click(screen.getByRole('button', { name: 'Delete' }));

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
                credentials: 'include',
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
        userEvent.click(screen.getByRole('button', { name: 'Delete all archived interviews' }));

        await waitFor(() =>
            expect(mockConfirm).toHaveBeenCalledWith({
                title: 'Confirm Deletion',
                description:
                    'Are you sure you want to delete all archived job interviews? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            })
        );

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/archived-job-interviews`, {
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
                <ViewArchivedInterview />
            </MemoryRouter>
        );

        expect(await screen.findByText(/no archived job interview found/i)).toBeInTheDocument();
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
});
