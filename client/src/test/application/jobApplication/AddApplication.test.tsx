import { fireEvent, screen, waitFor } from '@testing-library/react';
import AddApplication from '../../../pages/application/jobApplication/addApplication/AddApplication';
import { MemoryRouter } from 'react-router-dom';
import { render } from '../../renderWithToast';
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

        expect(screen.queryByRole('heading', { name: 'Add Job Application' })).not.toBeInTheDocument();
        userEvent.type(screen.getByLabelText(/company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/job title/i), 'Cleaner');
        userEvent.selectOptions(screen.getByLabelText(/job status/i), 'Interview');
        fireEvent.change(screen.getByLabelText(/application date/i), {
            target: { value: '2025-08-03T14:30' },
        });
        userEvent.type(screen.getByLabelText(/job location/i), 'Singapore');
        userEvent.type(screen.getByLabelText(/job posting url/i), 'https://example.com/jobs/1');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        const request = fetch.mock.calls[0][1] as RequestInit;
        expect(JSON.parse(request.body as string)).toEqual({
            appDate: new Date(2025, 7, 3, 14, 30).toISOString(),
            companyName: 'ABC Pte Ltd',
            jobLocation: 'Singapore',
            jobStatus: 'Interview',
            jobTitle: 'Cleaner',
            jobURL: 'https://example.com/jobs/1',
        });
        await waitFor(() => expect(screen.getByTestId('toast')).toBeInTheDocument());
        expect(screen.getByLabelText(/company name/i)).toHaveValue('');
        expect(screen.getByLabelText(/job title/i)).toHaveValue('');
        expect(screen.getByLabelText(/job status/i)).toHaveValue('Applied');
        expect(screen.getByLabelText(/application date/i)).toHaveValue('');
        expect(screen.getByLabelText(/job location/i)).toHaveValue('');
        expect(screen.getByLabelText(/job posting url/i)).toHaveValue('');
    });

    test('submits once when Enter is pressed in a form field', async () => {
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

        userEvent.type(screen.getByLabelText(/company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/job title/i), 'Cleaner{enter}');

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    });

    test('View Job Applications does not submit the form', () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        const viewApplicationsButton = screen.getByRole('button', { name: 'View Job Applications' });
        expect(viewApplicationsButton).toHaveAttribute('type', 'button');
        userEvent.click(viewApplicationsButton);

        expect(fetch).not.toHaveBeenCalled();
    });

    test('shows accessible inline errors for blank required fields and focuses company name first', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        const companyNameInput = screen.getByLabelText(/company name/i);
        const jobTitleInput = screen.getByLabelText(/job title/i);
        const companyNameError = await screen.findByText('Please enter a company name.');
        const jobTitleError = screen.getByText('Please enter a job title.');

        expect(companyNameInput).toHaveAttribute('aria-invalid', 'true');
        expect(companyNameInput).toHaveAttribute('aria-describedby', companyNameError.id);
        expect(companyNameError).toHaveAttribute('role', 'alert');
        expect(jobTitleInput).toHaveAttribute('aria-invalid', 'true');
        expect(jobTitleInput).toHaveAttribute('aria-describedby', jobTitleError.id);
        expect(document.activeElement).toBe(companyNameInput);
        expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    test('clears only the edited field error and preserves entered values after client validation fails', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.click(screen.getByRole('button', { name: /add job application/i }));
        await screen.findByText('Please enter a company name.');

        const companyNameInput = screen.getByLabelText(/company name/i);
        userEvent.type(companyNameInput, 'ABC Pte Ltd');

        expect(screen.queryByText('Please enter a company name.')).not.toBeInTheDocument();
        expect(screen.getByText('Please enter a job title.')).toBeInTheDocument();
        expect(companyNameInput).not.toHaveAttribute('aria-invalid');
        expect(companyNameInput).not.toHaveAttribute('aria-describedby');
        expect(companyNameInput).toHaveValue('ABC Pte Ltd');
    });

    test('does not accept whitespace-only required fields', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/company name/i), '   ');
        userEvent.type(screen.getByLabelText(/job title/i), 'Cleaner');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(screen.getByText('Please enter a company name.')).toBeInTheDocument());
        expect(fetch).not.toHaveBeenCalled();
    });

    test('does not use the current date when the application date is partially entered', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/job title/i), 'Cleaner');

        const applicationDateInput = screen.getByLabelText(/application date/i);
        Object.defineProperty(applicationDateInput, 'validity', {
            configurable: true,
            value: { badInput: true },
        });

        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(screen.getByText('Please enter a valid application date.')).toBeInTheDocument());
        expect(document.activeElement).toBe(applicationDateInput);
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

        userEvent.type(screen.getByLabelText(/company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/job title/i), 'Cleaner');
        fireEvent.change(screen.getByLabelText(/application date/i), {
            target: { value: '1899-12-31T23:59' },
        });
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(fetch).toHaveBeenCalled());

        const request = fetch.mock.calls[0][1] as RequestInit;
        expect(JSON.parse(request.body as string).appDate).toContain('1899-12-31');
    });

    test('shows an inline error and does not submit an invalid job URL', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/job title/i), 'Cleaner');
        userEvent.type(screen.getByLabelText(/job posting url/i), 'not-a-valid-url');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(screen.getByText('URL must be in a valid format.')).toBeInTheDocument());
        const jobURLInput = screen.getByLabelText(/job posting url/i);
        const jobURLError = screen.getByText('URL must be in a valid format.');
        expect(jobURLInput).toHaveAttribute('aria-invalid', 'true');
        expect(jobURLInput).toHaveAttribute('aria-describedby', jobURLError.id);
        expect(document.activeElement).toBe(jobURLInput);
        expect(screen.getByLabelText(/company name/i)).toHaveValue('ABC Pte Ltd');
        expect(screen.getByLabelText(/job title/i)).toHaveValue('Cleaner');
        expect(jobURLInput).toHaveValue('not-a-valid-url');
        expect(fetch).not.toHaveBeenCalled();
    });

    test('does not submit a non-http job URL', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/job title/i), 'Cleaner');
        userEvent.type(screen.getByLabelText(/job posting url/i), 'javascript:alert(1)');
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

        userEvent.type(screen.getByLabelText(/company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/job title/i), 'Cleaner');
        userEvent.type(screen.getByLabelText(/job posting url/i), 'https://localhost/jobs/1');
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

        userEvent.type(screen.getByLabelText(/company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/job title/i), 'Cleaner');
        fireEvent.change(screen.getByLabelText(/application date/i), {
            target: { value: '2999-12-31T23:59' },
        });
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() =>
            expect(screen.getByText('Application date cannot be later than the current date.')).toBeInTheDocument()
        );
        expect(document.activeElement).toBe(screen.getByLabelText(/application date/i));
        expect(fetch).not.toHaveBeenCalled();
    });

    test('applies maximum lengths to application text inputs', () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        expect(screen.getByLabelText(/company name/i)).toHaveAttribute('maxlength', '150');
        expect(screen.getByLabelText(/job title/i)).toHaveAttribute('maxlength', '150');
        expect(screen.getByLabelText(/job status/i)).toHaveValue('Applied');
        expect(screen.getByLabelText(/job location/i)).toHaveAttribute('maxlength', '200');
        expect(screen.getByLabelText(/job posting url/i)).toHaveAttribute('maxlength', '2048');
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

        userEvent.type(screen.getByLabelText(/company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/job title/i), 'Cleaner');
        userEvent.type(screen.getByLabelText(/job location/i), '   ');
        userEvent.type(screen.getByLabelText(/job posting url/i), '   ');
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

        userEvent.type(screen.getByLabelText(/company name/i), '  Morgan Stanley  ');
        userEvent.type(screen.getByLabelText(/job title/i), '  Software Engineer  ');
        userEvent.type(screen.getByLabelText(/job location/i), '  Singapore  ');
        userEvent.type(screen.getByLabelText(/job posting url/i), '  https://example.com/jobs/1  ');
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

        userEvent.type(screen.getByLabelText(/company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/job title/i), 'Cleaner');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(screen.getByText('Failed to add a job application')).toBeInTheDocument());
        expect(screen.getByLabelText(/company name/i)).toHaveValue('ABC Pte Ltd');
        expect(screen.getByLabelText(/job title/i)).toHaveValue('Cleaner');
    });
});
