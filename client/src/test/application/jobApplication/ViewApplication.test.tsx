import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ViewApplication from '../../../pages/application/jobApplication/viewApplication/ViewApplication';
import { render } from '../../renderWithToast';
import userEvent from '@testing-library/user-event';
import { JOB_STATUSES } from '../../../pages/application/models';
import type { ReactNode } from 'react';

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

const mockInterview = {
    interview_id: 1,
    job_id: 1,
    company_name: 'ABC Pte Ltd',
    job_title: 'Software Engineer',
    interview_date: '2025-07-20T00:00:00Z',
    interview_location: 'Zoom',
    interview_type: 'Technical',
    interview_notes: '',
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

vi.mock('@dnd-kit/core', () => ({
    DndContext: ({
        children,
        onDragCancel,
        onDragEnd,
        onDragStart,
    }: {
        children: ReactNode;
        onDragCancel?: () => void;
        onDragEnd: (event: { active: { id: string }; over: { id: string } }) => void;
        onDragStart?: (event: { active: { id: string } }) => void;
    }) => (
        <div>
            <button
                data-testid='mock-start-drag-application-1'
                hidden
                onClick={() => onDragStart?.({ active: { id: '1' } })}
                type='button'
            />
            <button data-testid='mock-cancel-drag' hidden onClick={() => onDragCancel?.()} type='button' />
            <button
                data-testid='mock-drag-application-1-to-interview'
                hidden
                onClick={() => onDragEnd({ active: { id: '1' }, over: { id: 'Interview' } })}
                type='button'
            />
            <button
                data-testid='mock-drag-application-1-to-applied'
                hidden
                onClick={() => onDragEnd({ active: { id: '1' }, over: { id: 'Applied' } })}
                type='button'
            />
            {children}
        </div>
    ),
    KeyboardSensor: vi.fn(),
    PointerSensor: vi.fn(),
    useDraggable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
    }),
    useDroppable: () => ({
        isOver: false,
        setNodeRef: vi.fn(),
    }),
    useSensor: vi.fn(),
    useSensors: vi.fn(),
}));

globalThis.alert = vi.fn();

const applicationRequestCount = (url: string) =>
    fetch.mock.calls.filter(([requestUrl]) => String(requestUrl) === url).length;

const statusUpdateRequestCount = (jobId: number) =>
    fetch.mock.calls.filter(
        ([url, init]: [string, RequestInit?]) =>
            url.endsWith(`/job-applications/${jobId}/status`) && init?.method === 'PATCH'
    ).length;

const clickConfirmedAction = async (button: HTMLElement) => {
    await act(async () => {
        await userEvent.click(button);
    });
};

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
            if (url.endsWith('/job-applications/summary')) {
                return response({ application_count: 1, related_interview_count: 0 });
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
        expect(screen.getByRole('button', { name: 'Filter by' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.queryByRole('region', { name: 'Application board' })).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Display options' }));
        expect(screen.getByRole('switch', { name: 'Show notes' })).toHaveAttribute('aria-checked', 'false');
        expect(screen.getByRole('switch', { name: 'Show archive' })).toHaveAttribute('aria-checked', 'false');
        expect(screen.getByRole('switch', { name: 'Auto scroll after job status change' })).toHaveAttribute(
            'aria-checked',
            'false'
        );
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        expect(screen.getByRole('button', { name: /delete all applications/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /archive all applications/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Export as CSV' })).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith(
            `${
                import.meta.env.VITE_API_URL
            }/job-applications?jobStatuses=Accepted&jobStatuses=Applied&jobStatuses=Declined&jobStatuses=Ghosted&jobStatuses=Interview&jobStatuses=Offer&jobStatuses=Rejected`,
            {
                method: 'GET',
            }
        );
    });

    test('places the view toggle before the application controls', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);

        const listButton = screen.getByRole('button', { name: 'List' });
        const boardButton = screen.getByRole('button', { name: 'Board' });
        const filterButton = screen.getByRole('button', { name: 'Filter by' });
        const displayButton = screen.getByRole('button', { name: 'Display options' });
        const moreButton = screen.getByRole('button', { name: 'More...' });

        expect(listButton.compareDocumentPosition(boardButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(boardButton.compareDocumentPosition(filterButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(filterButton.compareDocumentPosition(displayButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(displayButton.compareDocumentPosition(moreButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test('switches to board view and groups applications by status', async () => {
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
            if (init?.method !== 'GET') {
                return response(undefined, 204);
            }
            return response([
                mockApplication,
                { ...mockApplication, job_id: 2, company_name: 'Offer Pte Ltd', job_status: 'Offer' },
            ]);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Board' }));

        const board = screen.getByRole('region', { name: 'Application board' });
        expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'true');
        expect(
            within(board)
                .getAllByRole('heading', { level: 2 })
                .map((heading) => heading.textContent)
        ).toEqual(['Accepted 0', 'Offer 1', 'Declined 0', 'Interview 0', 'Applied 1', 'Ghosted 0', 'Rejected 0']);
        expect(within(board).getByRole('heading', { name: 'Applied 1' })).toBeInTheDocument();
        expect(within(board).getByRole('heading', { name: 'Offer 1' })).toBeInTheDocument();
        const applicationCard = within(board).getByRole('article', { name: /ABC Pte Ltd Software Engineer/i });
        expect(applicationCard).toBeInTheDocument();
        expect(within(applicationCard).getByText('20 Jun 2025')).toBeInTheDocument();
        expect(within(applicationCard).queryByText('Remote')).not.toBeInTheDocument();
        expect(within(applicationCard).queryByText('Applied 20 Jun 2025')).not.toBeInTheDocument();
        expect(within(applicationCard).queryByText(/\d+ days \d+ hours \d+ minutes/)).not.toBeInTheDocument();
        expect(within(board).getByRole('article', { name: /Offer Pte Ltd Software Engineer/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Display options' })).not.toBeInTheDocument();
    });

    test('board filters hide excluded columns without resetting the selected view', async () => {
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
                return response([{ ...mockApplication, job_status: 'Offer' }]);
            }
            if (init?.method !== 'GET') {
                return response(undefined, 204);
            }
            return response([mockApplication]);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Board' }));
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Offer' }));

        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'true')
        );
        expect(screen.getByRole('heading', { name: 'Offer 1' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Applied 0' })).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'List' }));
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        expect(screen.getByRole('checkbox', { name: 'Offer' })).toBeChecked();
    });

    test('uses user preferences for the selected application view', async () => {
        const { unmount } = render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>,
            { initialPreferences: { application_view_mode: 'board' } }
        );

        await screen.findByRole('region', { name: 'Application board' });
        expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'true');

        unmount();
        fetch.mockClear();

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.queryByRole('region', { name: 'Application board' })).not.toBeInTheDocument();
    });

    test('updates status from the board fallback without auto scrolling and shows the update in list view', async () => {
        const scrollIntoView = vi.fn();
        HTMLElement.prototype.scrollIntoView = scrollIntoView;

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>,
            { initialPreferences: { application_enable_scroll: true } }
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Board' }));
        await userEvent.selectOptions(
            screen.getByRole('combobox', { name: 'Move ABC Pte Ltd to status' }),
            'Interview'
        );

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-applications/1/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ editStatus: false, jobStatus: 'Interview' }),
            })
        );
        expect(screen.getByRole('heading', { name: 'Applied 0' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Interview 1' })).toBeInTheDocument();
        expect(scrollIntoView).not.toHaveBeenCalled();

        await userEvent.click(screen.getByRole('button', { name: 'List' }));
        expect(screen.getByText(/^Job Status: Interview$/)).toBeInTheDocument();
    });

    test('dragging a board card updates status through the existing status endpoint without auto scrolling', async () => {
        const scrollIntoView = vi.fn();
        HTMLElement.prototype.scrollIntoView = scrollIntoView;

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>,
            { initialPreferences: { application_enable_scroll: true } }
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Board' }));
        fireEvent.click(screen.getByTestId('mock-drag-application-1-to-interview'));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-applications/1/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ editStatus: false, jobStatus: 'Interview' }),
            })
        );
        expect(screen.getByRole('heading', { name: 'Interview 1' })).toBeInTheDocument();
        expect(scrollIntoView).not.toHaveBeenCalled();
    });

    test('dropping a board card into its current status does not call the update endpoint', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Board' }));
        const statusUpdatesBeforeDrop = statusUpdateRequestCount(1);
        fireEvent.click(screen.getByTestId('mock-drag-application-1-to-applied'));

        expect(statusUpdateRequestCount(1)).toBe(statusUpdatesBeforeDrop);
    });

    test('disables moving board applications with interviews back to applied', async () => {
        fetch.mockImplementation(async (url: string, init?: RequestInit) => {
            if (url.endsWith('/user-preferences')) {
                return response({
                    ...mockPreferences,
                    ...(init?.body ? JSON.parse(String(init.body)) : {}),
                });
            }
            if (url.endsWith('/job-interviews')) {
                return response([mockInterview]);
            }
            if (init?.method !== 'GET') {
                return response(undefined, 204);
            }
            return response([{ ...mockApplication, job_status: 'Interview' }]);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Board' }));

        const board = screen.getByRole('region', { name: 'Application board' });
        const appliedColumn = within(board).getByRole('region', { name: 'Applied 0' });
        const statusSelect = screen.getByRole('combobox', { name: 'Move ABC Pte Ltd to status' });

        expect(within(statusSelect).getByRole('option', { name: 'Applied' })).toBeDisabled();
        expect(appliedColumn).not.toHaveAttribute('aria-disabled');

        fireEvent.click(screen.getByTestId('mock-start-drag-application-1'));

        expect(appliedColumn).toHaveAttribute('aria-disabled', 'true');

        const statusUpdatesBeforeDrop = statusUpdateRequestCount(1);
        fireEvent.click(screen.getByTestId('mock-drag-application-1-to-applied'));

        expect(statusUpdateRequestCount(1)).toBe(statusUpdatesBeforeDrop);
        expect(appliedColumn).not.toHaveAttribute('aria-disabled');
        expect(screen.getByRole('heading', { name: 'Interview 1' })).toBeInTheDocument();
    });

    test('prevents duplicate board status update requests for the same card', async () => {
        let resolveStatusUpdate: ((value: ReturnType<typeof response>) => void) | undefined;
        const pendingStatusUpdate = new Promise<ReturnType<typeof response>>((resolve) => {
            resolveStatusUpdate = resolve;
        });

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
            if (url.endsWith('/job-applications/1/status') && init?.method === 'PATCH') {
                return await pendingStatusUpdate;
            }
            return init?.method === 'GET' ? response([mockApplication]) : response(undefined, 204);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Board' }));
        fireEvent.click(screen.getByTestId('mock-drag-application-1-to-interview'));
        fireEvent.click(screen.getByTestId('mock-drag-application-1-to-interview'));

        expect(statusUpdateRequestCount(1)).toBe(1);
        resolveStatusUpdate?.(response(undefined, 204));
        await waitFor(() => expect(screen.getByRole('heading', { name: 'Interview 1' })).toBeInTheDocument());
    });

    test('rolls back an optimistic board status update when the API fails', async () => {
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
            if (url.endsWith('/job-applications/1/status') && init?.method === 'PATCH') {
                return response({ message: 'Status update is temporarily unavailable.' }, 503);
            }
            return init?.method === 'GET' ? response([mockApplication]) : response(undefined, 204);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Board' }));
        await userEvent.selectOptions(
            screen.getByRole('combobox', { name: 'Move ABC Pte Ltd to status' }),
            'Interview'
        );

        expect(await screen.findByText('Status update is temporarily unavailable.')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Applied 1' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Interview 0' })).toBeInTheDocument();
    });

    test('keeps board actions available without showing full notes directly on the card', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Board' }));

        expect(screen.getByPlaceholderText('Add your notes here')).not.toBeVisible();
        await userEvent.click(screen.getByText('Actions'));

        expect(screen.getByRole('link', { name: 'Open job posting' })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Add your notes here')).toBeVisible();
        expect(screen.getByPlaceholderText('Add your notes here')).toHaveAttribute('maxlength', '3000');
        expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    test('fetches applications from the server when the status filter changes', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));

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
                }
            )
        );
        await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Accepted' })).toBeChecked());

        const offerOnlyUrl = `${import.meta.env.VITE_API_URL}/job-applications?jobStatuses=Offer`;
        const offerOnlyRequestsBeforeRemovingAccepted = applicationRequestCount(offerOnlyUrl);
        await userEvent.click(screen.getByRole('checkbox', { name: 'Accepted' }));
        await waitFor(() =>
            expect(applicationRequestCount(offerOnlyUrl)).toBeGreaterThan(offerOnlyRequestsBeforeRemovingAccepted)
        );
        await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Accepted' })).not.toBeChecked());

        await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Offer' })).toBeChecked());
        const allStatusesUrl = `${
            import.meta.env.VITE_API_URL
        }/job-applications?jobStatuses=Accepted&jobStatuses=Applied&jobStatuses=Declined&jobStatuses=Ghosted&jobStatuses=Interview&jobStatuses=Offer&jobStatuses=Rejected`;
        const allStatusRequestsBeforeClearingFinalStatus = applicationRequestCount(allStatusesUrl);
        await userEvent.click(screen.getByRole('checkbox', { name: 'Offer' }));

        await waitFor(() =>
            expect(applicationRequestCount(allStatusesUrl)).toBeGreaterThan(allStatusRequestsBeforeClearingFinalStatus)
        );
        expect(screen.getByRole('checkbox', { name: 'Show All' })).toBeChecked();
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
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Show All' }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Offer' }));

        expect(screen.getByRole('checkbox', { name: 'Accepted' })).not.toBeDisabled();
        expect(screen.getByRole('checkbox', { name: 'Offer' })).not.toBeDisabled();
        expect(screen.getAllByRole('status', { name: 'Loading results' })).toHaveLength(2);
        expect(screen.queryByText(/ABC Pte Ltd/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('progressbar', { name: 'Loading' })).not.toBeInTheDocument();

        resolveFilterRequest?.(response([mockApplication]));

        await waitFor(() => expect(screen.queryAllByRole('status', { name: 'Loading results' })).toHaveLength(0));
        expect(screen.getByText(/ABC Pte Ltd/i)).toBeInTheDocument();
    });

    test('shows application controls above the skeleton during the initial fetch', () => {
        fetch.mockImplementation(async (url: string) => {
            if (url.endsWith('/job-interviews')) {
                return response([]);
            }

            return await new Promise<ReturnType<typeof response>>(() => undefined);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        const filterButton = screen.getByRole('button', { name: 'Filter by' });
        const [firstSkeleton] = screen.getAllByRole('status', { name: 'Loading results' });

        expect(filterButton.compareDocumentPosition(firstSkeleton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(filterButton).toBeDisabled();
        expect(screen.queryByText(/no job applications match/i)).not.toBeInTheDocument();
    });

    test('shows the board skeleton during the initial fetch in board view', async () => {
        fetch.mockImplementation(async (url: string) => {
            if (url.endsWith('/job-interviews')) {
                return response([]);
            }

            return await new Promise<ReturnType<typeof response>>(() => undefined);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>,
            { initialPreferences: { application_view_mode: 'board' } }
        );

        expect(await screen.findByRole('status', { name: 'Loading board' })).toBeInTheDocument();
        expect(screen.getAllByTestId('skeleton-board-column')).toHaveLength(4);
        expect(screen.queryAllByRole('status', { name: 'Loading results' })).toHaveLength(0);
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
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
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
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-applications/1/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ editStatus: true, jobStatus: 'Applied' }),
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

        const statusUpdateCalls = fetch.mock.calls.filter(
            ([url, init]: [string, RequestInit?]) =>
                url.endsWith('/job-applications/2/status') && init?.method === 'PATCH'
        );
        expect(statusUpdateCalls).toHaveLength(2);
        expect(statusUpdateCalls[1][1]).toMatchObject({
            body: JSON.stringify({ editStatus: false, jobStatus: 'Offer' }),
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
        await userEvent.click(screen.getByRole('button', { name: 'Display options' }));
        await userEvent.click(screen.getByRole('switch', { name: 'Show archive' }));
        await userEvent.click(screen.getByRole('button', { name: 'Archive' }));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/archived-job-applications`, {
                method: 'PATCH',
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
        await userEvent.click(screen.getByRole('button', { name: 'Display options' }));
        await userEvent.click(screen.getByRole('switch', { name: 'Show notes' }));

        expect(screen.getByPlaceholderText('Add your notes here')).toHaveAttribute('maxlength', '3000');
    });

    test('renders the active application empty state with no data', async () => {
        fetch.mockResolvedValue(response([]));

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        expect(await screen.findByRole('heading', { name: 'No active applications yet' })).toBeInTheDocument();
        expect(screen.getByText(/add your first job application/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Add application' })).toHaveAttribute('href', '/application/add');
        expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        expect(screen.getByRole('checkbox', { name: 'Show All' })).toBeVisible();
        expect(screen.getByRole('checkbox', { name: 'Accepted' })).toBeVisible();
    });

    test('clears active application filters, saves all statuses, and refreshes list results', async () => {
        fetch.mockImplementation(async (url: string) => {
            if (url.endsWith('/job-interviews')) {
                return response([]);
            }
            if (url.includes('jobStatuses=Accepted')) {
                return response([mockApplication]);
            }
            return response([]);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>,
            { initialPreferences: { application_job_statuses: ['Offer'] } }
        );

        expect(await screen.findByRole('heading', { name: 'No applications match your filters' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

        expect(await screen.findByText(/ABC Pte Ltd/i)).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith(
            `${
                import.meta.env.VITE_API_URL
            }/job-applications?jobStatuses=Accepted&jobStatuses=Applied&jobStatuses=Declined&jobStatuses=Ghosted&jobStatuses=Interview&jobStatuses=Offer&jobStatuses=Rejected`,
            { method: 'GET' }
        );
        await userEvent.click(screen.getByRole('button', { name: 'Filter by' }));
        expect(screen.getByRole('checkbox', { name: 'Show All' })).toBeChecked();
    });

    test('clears active application filters and refreshes board results', async () => {
        fetch.mockImplementation(async (url: string) => {
            if (url.endsWith('/job-interviews')) {
                return response([]);
            }
            if (url.includes('jobStatuses=Accepted')) {
                return response([mockApplication]);
            }
            return response([]);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>,
            { initialPreferences: { application_job_statuses: ['Offer'], application_view_mode: 'board' } }
        );

        expect(await screen.findByRole('heading', { name: 'No applications match your filters' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

        const board = await screen.findByRole('region', { name: 'Application board' });
        expect(within(board).getByRole('article', { name: /ABC Pte Ltd Software Engineer/i })).toBeInTheDocument();
    });

    test('renders the active application empty state inside board layout', async () => {
        fetch.mockResolvedValue(response([]));

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>,
            { initialPreferences: { application_view_mode: 'board' } }
        );

        expect(await screen.findByRole('heading', { name: 'No active applications yet' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Add application' })).toHaveAttribute('href', '/application/add');
        expect(screen.queryByRole('region', { name: 'Application board' })).not.toBeInTheDocument();
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
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await clickConfirmedAction(screen.getByRole('button', { name: /delete all applications/i }));

        await waitFor(() =>
            expect(mockConfirm).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Confirm Delete All',
                    description:
                        'Delete all 1 active job application and its 0 related active interviews? This affects every active application you own, including applications not visible under the current job-status filters. This action is permanent and cannot be undone.',
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
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-applications`, {
                method: 'DELETE',
            })
        );

        await waitFor(() => expect(screen.queryByText(/ABC Pte Ltd/i)).not.toBeInTheDocument());
    });

    test('orders Export, Archive All, and Delete All with exactly two dividers', async () => {
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );

        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        const options = screen.getByRole('link', { name: 'Export as CSV' }).parentElement;

        expect(options).not.toBeNull();
        expect(
            Array.from(options?.children ?? []).map((item) =>
                item.tagName === 'HR' ? 'divider' : item.textContent?.trim()
            )
        ).toEqual(['Export as CSV', 'divider', 'Archive all applications', 'divider', 'Delete all applications']);
    });

    test('archives every active application with accurate related-interview counts', async () => {
        fetch.mockImplementation(async (url: string, init?: RequestInit) => {
            if (url.endsWith('/job-applications/summary')) {
                return response({ application_count: 2, related_interview_count: 1 });
            }
            if (url.endsWith('/job-interviews')) {
                return response([mockInterview]);
            }
            return init?.method === 'GET' ? response([mockApplication]) : response(undefined, 204);
        });
        mockConfirm.mockResolvedValueOnce({ confirmed: true });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );
        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await clickConfirmedAction(screen.getByRole('button', { name: 'Archive all applications' }));

        expect(mockConfirm).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Confirm Archive All',
                description:
                    'Archive all 2 active job applications and their 1 related active interview? This affects every active application you own, including applications not visible under the current job-status filters.',
            })
        );
        expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/archived-job-applications/archive-all`, {
            method: 'PATCH',
        });
        expect(await screen.findByRole('heading', { name: 'No active applications yet' })).toBeInTheDocument();
    });

    test('does not mutate when the bulk confirmation is cancelled or closed', async () => {
        mockConfirm.mockResolvedValueOnce({ confirmed: false });
        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );
        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await clickConfirmedAction(screen.getByRole('button', { name: 'Archive all applications' }));

        expect(fetch).not.toHaveBeenCalledWith(
            `${import.meta.env.VITE_API_URL}/archived-job-applications/archive-all`,
            { method: 'PATCH' }
        );
        expect(screen.getByText(/ABC Pte Ltd/i)).toBeInTheDocument();
    });

    test('keeps collection actions available when filters hide every owned application', async () => {
        fetch.mockImplementation(async (url: string) => {
            if (url.endsWith('/job-applications/summary')) {
                return response({ application_count: 3, related_interview_count: 1 });
            }
            return response([]);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>,
            { initialPreferences: { application_job_statuses: ['Offer'] } }
        );

        expect(await screen.findByRole('heading', { name: 'No applications match your filters' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'More...' })).toBeInTheDocument();
    });

    test('does not confirm or mutate when refreshed active counts fail', async () => {
        let summaryCalls = 0;
        fetch.mockImplementation(async (url: string, init?: RequestInit) => {
            if (url.endsWith('/job-applications/summary')) {
                summaryCalls += 1;
                if (summaryCalls === 2) {
                    throw new TypeError('Failed to fetch');
                }
                return response({ application_count: 1, related_interview_count: 0 });
            }
            if (url.endsWith('/job-interviews')) {
                return response([]);
            }
            return init?.method === 'GET' ? response([mockApplication]) : response(undefined, 204);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );
        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await userEvent.click(screen.getByRole('button', { name: 'Delete all applications' }));

        expect(
            await screen.findByText('Unable to load active application counts. Please try again.')
        ).toBeInTheDocument();
        expect(mockConfirm).not.toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-applications`, {
            method: 'DELETE',
        });
    });

    test('reconciles stale local applications without confirming when the current total is zero', async () => {
        let summaryCalls = 0;
        fetch.mockImplementation(async (url: string, init?: RequestInit) => {
            if (url.endsWith('/job-applications/summary')) {
                summaryCalls += 1;
                return response({ application_count: summaryCalls === 1 ? 1 : 0, related_interview_count: 0 });
            }
            if (url.endsWith('/job-interviews')) {
                return response([]);
            }
            return init?.method === 'GET' ? response([mockApplication]) : response(undefined, 204);
        });

        render(
            <MemoryRouter>
                <ViewApplication />
            </MemoryRouter>
        );
        await screen.findByText(/ABC Pte Ltd/i);
        await userEvent.click(screen.getByRole('button', { name: 'More...' }));
        await userEvent.click(screen.getByRole('button', { name: 'Delete all applications' }));

        expect(await screen.findByRole('heading', { name: 'No active applications yet' })).toBeInTheDocument();
        expect(mockConfirm).not.toHaveBeenCalled();
    });
});
