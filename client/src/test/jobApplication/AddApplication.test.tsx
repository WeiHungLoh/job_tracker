import { fireEvent, screen, waitFor } from '@testing-library/react';
import AddApplication from '../../pages/jobApplication/addApplication/AddApplication';
import { MemoryRouter } from 'react-router-dom';
import { render } from '../renderWithToast';
import userEvent from '@testing-library/user-event';

globalThis.fetch = vi.fn();

describe('User add application flow', () => {
    beforeEach(() => {
        fetch.mockReset();
    });

    test('successfully adds an application and a notification message is shown', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            headers: new Headers({ 'content-type': 'text/plain' }),
            text: async () => 'Successfully added a job application!',
        });

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/input company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(fetch).toHaveBeenCalled());
        await waitFor(() => expect(screen.getByTestId('toast')).toBeInTheDocument());
    });

    test('shows an error toast when company name is not filled in', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() =>
            expect(
                screen.getByText('Please enter company name and job title before adding a job application.')
            ).toBeInTheDocument()
        );
    });

    test('does not accept whitespace-only required fields', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/input company name/i), '   ');
        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() =>
            expect(
                screen.getByText('Please enter company name and job title before adding a job application.')
            ).toBeInTheDocument()
        );
        expect(fetch).not.toHaveBeenCalled();
    });

    test('does not use the current date when the application date is partially entered', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/input company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner');

        const applicationDateInput = screen.getByLabelText(/input application date/i);
        Object.defineProperty(applicationDateInput, 'validity', {
            configurable: true,
            value: { badInput: true },
        });

        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(screen.getByText('Please enter a valid application date.')).toBeInTheDocument());
        expect(fetch).not.toHaveBeenCalled();
    });

    test('submits a valid application date before 1900 without changing its year', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            headers: new Headers({ 'content-type': 'text/plain' }),
            text: async () => 'Successfully added a job application!',
        });

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/input company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner');
        fireEvent.change(screen.getByLabelText(/input application date/i), {
            target: { value: '1899-12-31T23:59' },
        });
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(fetch).toHaveBeenCalled());

        const request = fetch.mock.calls[0][1] as RequestInit;
        expect(JSON.parse(request.body as string).appDate).toContain('1899-12-31');
    });

    test('shows an error toast and does not submit an invalid job URL', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/input company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner');
        userEvent.type(screen.getByLabelText(/input job posting url/i), 'not-a-valid-url');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(screen.getByText('URL must be in a valid format.')).toBeInTheDocument());
        expect(fetch).not.toHaveBeenCalled();
    });

    test('does not submit a non-http job URL', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/input company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner');
        userEvent.type(screen.getByLabelText(/input job posting url/i), 'javascript:alert(1)');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(screen.getByText('URL must be in a valid format.')).toBeInTheDocument());
        expect(fetch).not.toHaveBeenCalled();
    });

    test('does not submit a job URL without a domain suffix', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/input company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner');
        userEvent.type(screen.getByLabelText(/input job posting url/i), 'https://localhost/jobs/1');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(screen.getByText('URL must be in a valid format.')).toBeInTheDocument());
        expect(fetch).not.toHaveBeenCalled();
    });

    test('does not submit an application date in the future', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/input company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner');
        fireEvent.change(screen.getByLabelText(/input application date/i), {
            target: { value: '2999-12-31T23:59' },
        });
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() =>
            expect(screen.getByText('Application date cannot be later than the current date.')).toBeInTheDocument()
        );
        expect(fetch).not.toHaveBeenCalled();
    });

    test('applies maximum lengths to application text inputs', () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        expect(screen.getByLabelText(/input company name/i)).toHaveAttribute('maxlength', '150');
        expect(screen.getByLabelText(/input job title/i)).toHaveAttribute('maxlength', '150');
        expect(screen.getByLabelText(/input job location/i)).toHaveAttribute('maxlength', '200');
        expect(screen.getByLabelText(/input job posting url/i)).toHaveAttribute('maxlength', '2048');
    });

    test('submits whitespace-only optional fields as empty strings', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            headers: new Headers({ 'content-type': 'text/plain' }),
            text: async () => 'Successfully added a job application!',
        });

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/input company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner');
        userEvent.type(screen.getByLabelText(/input job location/i), '   ');
        userEvent.type(screen.getByLabelText(/input job posting url/i), '   ');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(fetch).toHaveBeenCalled());

        const request = fetch.mock.calls[0][1] as RequestInit;
        expect(JSON.parse(request.body as string)).toMatchObject({ jobLocation: '', jobURL: '' });
    });

    test('trims text inputs before submitting them', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            headers: new Headers({ 'content-type': 'text/plain' }),
            text: async () => 'Successfully added a job application!',
        });

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/input company name/i), '  Morgan Stanley  ');
        userEvent.type(screen.getByLabelText(/input job title/i), '  Software Engineer  ');
        userEvent.type(screen.getByLabelText(/input job location/i), '  Singapore  ');
        userEvent.type(screen.getByLabelText(/input job posting url/i), '  https://example.com/jobs/1  ');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(fetch).toHaveBeenCalled());

        const request = fetch.mock.calls[0][1] as RequestInit;
        expect(JSON.parse(request.body as string)).toMatchObject({
            companyName: 'Morgan Stanley',
            jobTitle: 'Software Engineer',
            jobLocation: 'Singapore',
            jobURL: 'https://example.com/jobs/1',
        });
    });

    test('preserves form contents after a backend error', async () => {
        fetch.mockResolvedValueOnce({
            headers: new Headers({ 'content-type': 'text/plain' }),
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Failed to add a job application',
        });

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/input company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(screen.getByText('Failed to add a job application')).toBeInTheDocument());
        expect(screen.getByLabelText(/input company name/i)).toHaveValue('ABC Pte Ltd');
        expect(screen.getByLabelText(/input job title/i)).toHaveValue('Cleaner');
    });
});
