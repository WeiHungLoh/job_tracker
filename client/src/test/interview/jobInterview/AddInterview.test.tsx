import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AddInterview from '../../../pages/interview/jobInterview/addInterview/AddInterview';
import ViewApplication from '../../../pages/application/jobApplication/viewApplication/ViewApplication';
import { render } from '../../renderWithToast';
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

        fireEvent.change(screen.getByLabelText('Interview Date'), { target: { value: '2025-08-03T14:30' } });
        userEvent.type(screen.getByLabelText('Interview Location'), 'Zoom');
        userEvent.type(screen.getByLabelText('Interview Type (optional)'), 'HR');
        userEvent.type(screen.getByLabelText('Additional Notes (optional)'), '2nd round');
        userEvent.click(screen.getByTestId('add-interview'));

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        await waitFor(() => {
            expect(screen.getByLabelText('Interview Date')).toHaveValue('');
            expect(screen.getByLabelText('Interview Location')).toHaveValue('');
            expect(screen.getByLabelText('Interview Type (optional)')).toHaveValue('');
            expect(screen.getByLabelText('Additional Notes (optional)')).toHaveValue('');
        });
    });

    test('submits once when Enter is pressed in a form field', async () => {
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

        fireEvent.change(screen.getByLabelText('Interview Date'), { target: { value: '2025-08-03T14:30' } });
        userEvent.type(screen.getByLabelText('Interview Location'), 'Zoom{enter}');

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    });

    test('View Interviews and Back do not submit the form', () => {
        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/add', state: { app: mockApplication } }]}>
                <Routes>
                    <Route path='/interview/add' element={<AddInterview />} />
                    <Route path='/interview/view' element={<p>Interviews</p>} />
                </Routes>
            </MemoryRouter>
        );

        const viewInterviewsButton = screen.getByRole('button', { name: 'View Interviews' });
        const backButton = screen.getByRole('button', { name: 'Back' });
        expect(viewInterviewsButton).toHaveAttribute('type', 'button');
        expect(backButton).toHaveAttribute('type', 'button');
        userEvent.click(viewInterviewsButton);

        expect(fetch).not.toHaveBeenCalled();
    });

    test('rejects a whitespace-only interview location', async () => {
        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/add', state: { app: mockApplication } }]}>
                <Routes>
                    <Route path='/interview/add' element={<AddInterview />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('Interview Date'), { target: { value: '2025-08-03T14:30' } });
        userEvent.type(screen.getByLabelText('Interview Location'), '   ');
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

        fireEvent.change(screen.getByLabelText('Interview Date'), {
            target: { value: '2025-08-03T14:30' },
        });
        userEvent.type(screen.getByLabelText('Interview Location'), 'Zoom');
        userEvent.click(screen.getByTestId('add-interview'));

        await waitFor(() =>
            expect(screen.getByText('Interview date must be after the job application date.')).toBeInTheDocument()
        );
        expect(fetch).not.toHaveBeenCalled();
    });

    test('does not submit an interview date with a year above 9999', async () => {
        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/add', state: { app: mockApplication } }]}>
                <Routes>
                    <Route path='/interview/add' element={<AddInterview />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('Interview Date'), {
            target: { value: '20300-03-30T00:00' },
        });
        userEvent.type(screen.getByLabelText('Interview Location'), 'Zoom');
        userEvent.click(screen.getByTestId('add-interview'));

        await waitFor(() => expect(screen.getByText('Please enter a valid interview date.')).toBeInTheDocument());
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

        fireEvent.change(screen.getByLabelText('Interview Date'), { target: { value: '2025-08-03T14:30' } });
        userEvent.type(screen.getByLabelText('Interview Location'), '  Zoom  ');
        userEvent.type(screen.getByLabelText('Interview Type (optional)'), '  HR  ');
        userEvent.type(screen.getByLabelText('Additional Notes (optional)'), '   ');
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

        expect(screen.getByLabelText('Interview Location')).toHaveAttribute('maxlength', '200');
        expect(screen.getByLabelText('Interview Type (optional)')).toHaveAttribute('maxlength', '100');
        expect(screen.getByLabelText('Additional Notes (optional)')).toHaveAttribute('maxlength', '3000');
        expect(screen.getByLabelText('Interview Date')).toHaveAttribute('max', '9999-12-31T23:59');
    });

    test('preserves form contents after a backend error', async () => {
        fetch.mockResolvedValueOnce({
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ message: 'Interview fields are invalid.' }),
            ok: false,
            status: 422,
            statusText: 'Unprocessable Entity',
        });

        render(
            <MemoryRouter initialEntries={[{ pathname: '/interview/add', state: { app: mockApplication } }]}>
                <Routes>
                    <Route path='/interview/add' element={<AddInterview />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('Interview Date'), {
            target: { value: '2025-08-03T14:30' },
        });
        userEvent.type(screen.getByLabelText('Interview Location'), 'Zoom');
        userEvent.type(screen.getByLabelText('Interview Type (optional)'), 'Technical');
        userEvent.click(screen.getByTestId('add-interview'));

        await waitFor(() => expect(screen.getByText('Interview fields are invalid.')).toBeInTheDocument());
        expect(screen.getByLabelText('Interview Date')).toHaveValue('2025-08-03T14:30');
        expect(screen.getByLabelText('Interview Location')).toHaveValue('Zoom');
        expect(screen.getByLabelText('Interview Type (optional)')).toHaveValue('Technical');
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
