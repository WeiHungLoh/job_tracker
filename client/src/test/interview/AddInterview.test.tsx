import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AddInterview from '../../pages/interview/addInterview/AddInterview';
import ViewApplication from '../../pages/jobApplication/viewApplication/ViewApplication';
import { render } from '../renderWithToast';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

globalThis.fetch = vi.fn();

const mockApplication = {
    job_id: 1,
    company_name: 'IRAS',
    job_title: 'Data Engineer',
};

describe('AddInterview page', () => {
    beforeEach(() => {
        fetch.mockReset();
    });

    test('renders correctly when state is passed', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            headers: new Headers({ 'content-type': 'text/plain' }),
            text: async () => 'Successfully added an interview!',
        });

        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/add', state: { app: mockApplication } }]}>
                <Routes>
                    <Route path='/interview/add' element={<AddInterview />} />
                    <Route path='/application/view' element={<ViewApplication />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(/you are adding an interview for/i)).toBeInTheDocument();
        expect(screen.getByText(/iras/i)).toBeInTheDocument();
        expect(screen.getByText(/data engineer/i)).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Input Interview Date'), { target: { value: '2025-08-03T14:30' } });
        userEvent.type(screen.getByLabelText('Input Interview Location'), 'Zoom');
        userEvent.type(screen.getByLabelText('Input Interview Type (optional)'), 'HR');
        userEvent.type(screen.getByLabelText('Input Additional Notes (optional)'), '2nd round');
        userEvent.click(screen.getByTestId('add-interview'));

        await waitFor(() => expect(fetch).toHaveBeenCalled());
    });

    test('rejects a whitespace-only interview location', async () => {
        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/add', state: { app: mockApplication } }]}>
                <Routes>
                    <Route path='/interview/add' element={<AddInterview />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('Input Interview Date'), { target: { value: '2025-08-03T14:30' } });
        userEvent.type(screen.getByLabelText('Input Interview Location'), '   ');
        userEvent.click(screen.getByTestId('add-interview'));

        await waitFor(() =>
            expect(screen.getByText('Please enter a date and location before adding an interview.')).toBeInTheDocument()
        );
        expect(fetch).not.toHaveBeenCalled();
    });

    test('does not submit an interview date equal to the job application date', async () => {
        const mockApp = {
            ...mockApplication,
            application_date: '2025-08-03T14:30:00',
        };

        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/add', state: { app: mockApp } }]}>
                <Routes>
                    <Route path='/interview/add' element={<AddInterview />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('Input Interview Date'), {
            target: { value: '2025-08-03T14:30' },
        });
        userEvent.type(screen.getByLabelText('Input Interview Location'), 'Zoom');
        userEvent.click(screen.getByTestId('add-interview'));

        await waitFor(() =>
            expect(screen.getByText('Interview date must be after the job application date.')).toBeInTheDocument()
        );
        expect(fetch).not.toHaveBeenCalled();
    });

    test('trims interview text inputs before submitting them', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            headers: new Headers({ 'content-type': 'text/plain' }),
            text: async () => 'Successfully added an interview!',
        });

        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/add', state: { app: mockApplication } }]}>
                <Routes>
                    <Route path='/interview/add' element={<AddInterview />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('Input Interview Date'), { target: { value: '2025-08-03T14:30' } });
        userEvent.type(screen.getByLabelText('Input Interview Location'), '  Zoom  ');
        userEvent.type(screen.getByLabelText('Input Interview Type (optional)'), '  HR  ');
        userEvent.type(screen.getByLabelText('Input Additional Notes (optional)'), '   ');
        userEvent.click(screen.getByTestId('add-interview'));

        await waitFor(() => expect(fetch).toHaveBeenCalled());

        const request = fetch.mock.calls[0][1] as RequestInit;
        expect(JSON.parse(request.body as string)).toMatchObject({
            interviewLocation: 'Zoom',
            interviewType: 'HR',
            notes: '',
        });
    });

    test('applies maximum lengths to interview text inputs', () => {
        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/add', state: { app: mockApplication } }]}>
                <Routes>
                    <Route path='/interview/add' element={<AddInterview />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByLabelText('Input Interview Location')).toHaveAttribute('maxlength', '200');
        expect(screen.getByLabelText('Input Interview Type (optional)')).toHaveAttribute('maxlength', '100');
        expect(screen.getByLabelText('Input Additional Notes (optional)')).toHaveAttribute('maxlength', '3000');
    });

    test('redirects to /application/view when no state is passed', async () => {
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => [],
        });

        render(
            <MemoryRouter initialEntries={['/interview/add']}>
                <Routes>
                    <Route path='/interview/add' element={<AddInterview />} />
                    <Route path='/application/view' element={<ViewApplication />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText(/filter by/i)).toBeInTheDocument());
    });
});
