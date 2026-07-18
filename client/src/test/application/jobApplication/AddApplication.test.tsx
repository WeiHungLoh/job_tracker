import type { ReactNode } from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import AddApplication from '../../../pages/application/jobApplication/addApplication/AddApplication';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render as renderWithToast } from '../../renderWithToast';
import userEvent from '@testing-library/user-event';
import { ConfirmProvider } from 'material-ui-confirm';
import { defaultConfirmOptions } from '../../../components/confirmation/defaultConfirmOptions';
import formatDate from '../../../helper/dateFormatter';
import { MAX_CAPTURED_PAGE_TITLE_LENGTH } from '../../../pages/application/jobApplication/quickCapture';
import QuickCaptureProvider from '../../../pages/application/jobApplication/QuickCaptureProvider';

globalThis.fetch = vi.fn();

const DUPLICATE_APPLICATION = {
    company_name: 'Morgan Stanley',
    job_title: 'Software Engineer',
    application_date: '2026-03-03T02:30:00.000Z',
};

const duplicateResponse = (
    data: unknown = {
        code: 'POSSIBLE_DUPLICATE_APPLICATION',
        message: 'A possible duplicate job application already exists.',
        duplicate: DUPLICATE_APPLICATION,
    }
) => ({
    ok: false,
    status: 409,
    statusText: 'Conflict',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
});

const successResponse = () => ({
    ok: true,
    status: 201,
    headers: new Headers({ 'content-type': 'text/plain' }),
    text: async () => 'Successfully added a job application!',
});

const render = (ui: ReactNode) =>
    renderWithToast(<ConfirmProvider defaultOptions={defaultConfirmOptions}>{ui}</ConfirmProvider>);

const renderQuickCaptureApplication = (entry: string) =>
    render(
        <MemoryRouter initialEntries={[entry]}>
            <Routes>
                <Route element={<QuickCaptureProvider />}>
                    <Route path='/application/add' element={<AddApplication />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );

const fillCompleteApplicationForm = () => {
    userEvent.type(screen.getByLabelText(/company name/i), '  Morgan Stanley  ');
    userEvent.type(screen.getByLabelText(/job title/i), '  Software Engineer  ');
    userEvent.selectOptions(screen.getByLabelText(/job status/i), 'Interview');
    fireEvent.change(screen.getByLabelText(/application date/i), {
        target: { value: '2025-08-03T14:30' },
    });
    userEvent.type(screen.getByLabelText(/job location/i), '  Singapore  ');
    userEvent.type(screen.getByLabelText(/job posting url/i), '  https://example.com/jobs/1  ');
};

const expectCompleteApplicationFormValues = () => {
    expect(screen.getByLabelText(/company name/i)).toHaveValue('  Morgan Stanley  ');
    expect(screen.getByLabelText(/job title/i)).toHaveValue('  Software Engineer  ');
    expect(screen.getByLabelText(/job status/i)).toHaveValue('Interview');
    expect(screen.getByLabelText(/application date/i)).toHaveValue('2025-08-03T14:30');
    expect(screen.getByLabelText(/job location/i)).toHaveValue('  Singapore  ');
    expect(screen.getByLabelText(/job posting url/i)).toHaveValue('  https://example.com/jobs/1  ');
};

describe('User add application flow', () => {
    beforeEach(() => {
        fetch.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
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

    test('keeps the URL empty and hides captured title information without quick-capture parameters', () => {
        renderQuickCaptureApplication('/application/add');

        expect(screen.getByLabelText(/job posting url/i)).toHaveValue('');
        expect(screen.queryByText('Captured page title')).not.toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    test('prefills a captured URL once and lets the user edit or clear it', async () => {
        const replaceState = vi.spyOn(window.history, 'replaceState');
        renderQuickCaptureApplication('/application/add#jobURL=https%3A%2F%2Fexample.com%2Fjobs%2F1');

        const jobURLInput = screen.getByLabelText(/job posting url/i);
        expect(jobURLInput).toHaveValue('https://example.com/jobs/1');
        expect(screen.queryByText('Captured page title')).not.toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
        expect(replaceState).toHaveBeenCalledWith(window.history.state, '', '/application/add');

        await userEvent.clear(jobURLInput);
        await userEvent.type(jobURLInput, 'https://careers.example.com/jobs/2');
        expect(jobURLInput).toHaveValue('https://careers.example.com/jobs/2');

        await userEvent.clear(jobURLInput);
        expect(jobURLInput).toHaveValue('');
    });

    test('supports and removes legacy query capture parameters', () => {
        const replaceState = vi.spyOn(window.history, 'replaceState');
        const query = new URLSearchParams({
            jobURL: 'https://example.com/jobs/legacy',
            pageTitle: 'Legacy bookmark',
            source: 'saved',
        });

        renderQuickCaptureApplication(`/application/add?${query.toString()}`);

        expect(screen.getByLabelText(/job posting url/i)).toHaveValue('https://example.com/jobs/legacy');
        expect(screen.getByText('Legacy bookmark')).toBeInTheDocument();
        expect(replaceState).toHaveBeenCalledWith(window.history.state, '', '/application/add?source=saved');
    });

    test('shows a captured page title only as text and leaves company and job title empty', () => {
        const pageTitle = '<script>alert("x")</script>';
        const fragment = new URLSearchParams({
            jobURL: 'https://example.com/jobs/1',
            pageTitle,
        });

        renderQuickCaptureApplication(`/application/add#${fragment.toString()}`);

        expect(screen.getByText('Captured page title')).toBeInTheDocument();
        expect(screen.getByText(pageTitle)).toBeInTheDocument();
        expect(document.querySelector('script')).toBeNull();
        expect(screen.getByLabelText(/company name/i)).toHaveValue('');
        expect(screen.getByLabelText(/job title/i)).toHaveValue('');
        expect(fetch).not.toHaveBeenCalled();
    });

    test('hides whitespace page titles and caps long titles for display', () => {
        const longTitle = `  ${'x'.repeat(MAX_CAPTURED_PAGE_TITLE_LENGTH + 20)}  `;
        const { unmount } = renderQuickCaptureApplication('/application/add?pageTitle=%20%20%20');

        expect(screen.queryByText('Captured page title')).not.toBeInTheDocument();
        unmount();

        const query = new URLSearchParams({ pageTitle: longTitle });
        renderQuickCaptureApplication(`/application/add?${query.toString()}`);

        expect(screen.getByText('x'.repeat(MAX_CAPTURED_PAGE_TITLE_LENGTH))).toBeInTheDocument();
        expect(screen.queryByText('x'.repeat(MAX_CAPTURED_PAGE_TITLE_LENGTH + 1))).not.toBeInTheDocument();
    });

    test('uses existing submission validation for an invalid captured URL', async () => {
        const query = new URLSearchParams({ jobURL: 'javascript:alert(1)' });
        renderQuickCaptureApplication(`/application/add?${query.toString()}`);

        userEvent.type(screen.getByLabelText(/company name/i), 'ABC Pte Ltd');
        userEvent.type(screen.getByLabelText(/job title/i), 'Cleaner');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(screen.getByText('URL must be in a valid format.')).toBeInTheDocument());
        expect(document.activeElement).toBe(screen.getByLabelText(/job posting url/i));
        expect(fetch).not.toHaveBeenCalled();
    });

    test('does not submit the captured page title', async () => {
        fetch.mockResolvedValueOnce(successResponse());
        const query = new URLSearchParams({
            jobURL: 'https://example.com/jobs/1',
            pageTitle: 'Software Engineer at Example | Careers',
        });
        renderQuickCaptureApplication(`/application/add?${query.toString()}`);

        userEvent.type(screen.getByLabelText(/company name/i), 'Example');
        userEvent.type(screen.getByLabelText(/job title/i), 'Software Engineer');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        const request = fetch.mock.calls[0][1] as RequestInit;
        expect(JSON.parse(request.body as string)).toMatchObject({
            companyName: 'Example',
            jobTitle: 'Software Engineer',
            jobURL: 'https://example.com/jobs/1',
        });
        expect(JSON.parse(request.body as string)).not.toHaveProperty('pageTitle');
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
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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

    test('shows duplicate details with exactly Cancel and Add Anyway actions', async () => {
        fetch.mockResolvedValueOnce(duplicateResponse());

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/company name/i), 'Morgan Stanley');
        userEvent.type(screen.getByLabelText(/job title/i), 'Software Engineer');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        const dialog = await screen.findByRole('dialog');
        const formattedApplicationDate = formatDate(DUPLICATE_APPLICATION.application_date).formattedDate;

        expect(within(dialog).getByRole('heading', { name: 'Possible Duplicate Application' })).toBeInTheDocument();
        expect(dialog).toHaveTextContent(DUPLICATE_APPLICATION.company_name);
        expect(dialog).toHaveTextContent(DUPLICATE_APPLICATION.job_title);
        expect(dialog).toHaveTextContent(formattedApplicationDate);
        expect(within(dialog).getAllByRole('button')).toHaveLength(2);
        expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: 'Add Anyway' })).toBeInTheDocument();
        expect(within(dialog).queryByRole('button', { name: /view existing/i })).not.toBeInTheDocument();
        expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    });

    test('cancels a duplicate submission without retrying, resetting, or showing a toast', async () => {
        fetch.mockResolvedValueOnce(duplicateResponse());

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        fillCompleteApplicationForm();
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));
        userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(fetch).toHaveBeenCalledTimes(1);
        expectCompleteApplicationFormValues();
        expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    });

    test('closes a duplicate dialog with Escape without retrying, resetting, or showing a toast', async () => {
        fetch.mockResolvedValueOnce(duplicateResponse());

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        fillCompleteApplicationForm();
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));
        const dialog = await screen.findByRole('dialog');
        fireEvent.keyDown(dialog, { key: 'Escape' });

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(fetch).toHaveBeenCalledTimes(1);
        expectCompleteApplicationFormValues();
        expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    });

    test('adds anyway with the same normalized request, then shows success and resets once', async () => {
        fetch.mockResolvedValueOnce(duplicateResponse()).mockResolvedValueOnce(successResponse());

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        fillCompleteApplicationForm();
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));
        userEvent.click(await screen.findByRole('button', { name: 'Add Anyway' }));

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        const expectedRequest = {
            appDate: new Date(2025, 7, 3, 14, 30).toISOString(),
            companyName: 'Morgan Stanley',
            jobLocation: 'Singapore',
            jobStatus: 'Interview',
            jobTitle: 'Software Engineer',
            jobURL: 'https://example.com/jobs/1',
        };
        const firstRequest = fetch.mock.calls[0][1] as RequestInit;
        const confirmedRequest = fetch.mock.calls[1][1] as RequestInit;
        expect(JSON.parse(firstRequest.body as string)).toEqual(expectedRequest);
        expect(JSON.parse(confirmedRequest.body as string)).toEqual({ ...expectedRequest, allowDuplicate: true });

        await waitFor(() => expect(screen.getByText('Successfully added a job application!')).toBeInTheDocument());
        expect(screen.getAllByTestId('toast')).toHaveLength(1);
        expect(screen.getByLabelText(/company name/i)).toHaveValue('');
        expect(screen.getByLabelText(/job title/i)).toHaveValue('');
        expect(screen.getByLabelText(/job status/i)).toHaveValue('Applied');
        expect(screen.getByLabelText(/application date/i)).toHaveValue('');
        expect(screen.getByLabelText(/job location/i)).toHaveValue('');
        expect(screen.getByLabelText(/job posting url/i)).toHaveValue('');
    });

    test('confirms Add Anyway with Enter exactly once using the original normalized request', async () => {
        fetch.mockResolvedValueOnce(duplicateResponse()).mockResolvedValueOnce(successResponse());

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/company name/i), '  Morgan Stanley  ');
        userEvent.type(screen.getByLabelText(/job title/i), '  Software Engineer  ');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        const addAnywayButton = await screen.findByRole('button', { name: 'Add Anyway' });
        await waitFor(() => expect(addAnywayButton).toHaveFocus());
        userEvent.keyboard('{enter}');

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        const firstRequest = JSON.parse((fetch.mock.calls[0][1] as RequestInit).body as string);
        const confirmedRequest = JSON.parse((fetch.mock.calls[1][1] as RequestInit).body as string);
        const { allowDuplicate, ...confirmedRequestWithoutOverride } = confirmedRequest;
        expect(firstRequest).not.toHaveProperty('allowDuplicate');
        expect(allowDuplicate).toBe(true);
        expect(confirmedRequestWithoutOverride).toEqual(firstRequest);
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('shows the standard error toast and preserves values when Add Anyway fails', async () => {
        fetch.mockResolvedValueOnce(duplicateResponse()).mockResolvedValueOnce({
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

        fillCompleteApplicationForm();
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));
        userEvent.click(await screen.findByRole('button', { name: 'Add Anyway' }));

        await waitFor(() => expect(screen.getByText('Failed to add a job application')).toBeInTheDocument());
        expect(fetch).toHaveBeenCalledTimes(2);
        expectCompleteApplicationFormValues();
        expect(screen.getAllByTestId('toast')).toHaveLength(1);
    });

    test('handles a malformed duplicate conflict as a normal request error without opening a dialog', async () => {
        fetch.mockResolvedValueOnce(
            duplicateResponse({
                code: 'POSSIBLE_DUPLICATE_APPLICATION',
                message: 'Malformed duplicate response',
                duplicate: {
                    ...DUPLICATE_APPLICATION,
                    application_date: 'not-a-date',
                },
            })
        );

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/company name/i), 'Morgan Stanley');
        userEvent.type(screen.getByLabelText(/job title/i), 'Software Engineer');
        userEvent.click(screen.getByRole('button', { name: /add job application/i }));

        await waitFor(() => expect(screen.getByText('Malformed duplicate response')).toBeInTheDocument());
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('keeps one submission pending through the duplicate dialog', async () => {
        fetch.mockResolvedValueOnce(duplicateResponse());

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/company name/i), 'Morgan Stanley');
        userEvent.type(screen.getByLabelText(/job title/i), 'Software Engineer');
        const form = screen.getByRole('button', { name: /add job application/i }).closest('form');
        expect(form).not.toBeNull();

        fireEvent.submit(form!);
        fireEvent.submit(form!);

        await screen.findByRole('dialog');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(screen.getAllByRole('dialog')).toHaveLength(1);

        fireEvent.submit(form!);
        expect(fetch).toHaveBeenCalledTimes(1);
        userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(screen.getByRole('button', { name: /add job application/i })).not.toHaveAttribute('aria-busy');
    });
});
