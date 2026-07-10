import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import { appRoutes } from '../App';
import { render } from './renderWithToast';
import userEvent from '@testing-library/user-event';
import { JOB_STATUSES } from '../pages/application/models';
import { AUTH_FOCUSED_MODE_STORAGE_KEY } from '../components/authProductIntro/AuthProductIntro';
import { routes } from '../routes';

globalThis.fetch = vi.fn();

class RouterRequest {
    headers: Headers;
    method: string;
    signal: AbortSignal | undefined;
    url: string;

    constructor(input: string, init: RequestInit = {}) {
        this.headers = new Headers(init.headers);
        this.method = init.method ?? 'GET';
        this.signal = init.signal ?? undefined;
        this.url = input;
    }
}

vi.stubGlobal('Request', RouterRequest);

const response = (ok = true, status = 200, data?: string, contentType?: string) => ({
    headers: new Headers(contentType ? { 'content-type': contentType } : undefined),
    ok,
    status,
    statusText: '',
    text: async () => data ?? '',
    url: '',
});

const jsonResponse = (data: unknown, status = 200) => ({
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    text: async () => JSON.stringify(data),
    url: '',
});

const mockPreferences = {
    application_job_statuses: [...JOB_STATUSES],
    application_show_notes: false,
    application_show_archive: false,
    application_enable_scroll: false,
    application_view_mode: 'list',
    archived_application_job_statuses: [...JOB_STATUSES],
    archived_application_show_notes: false,
    archived_application_view_mode: 'list',
};

const renderRoute = (path: string) => {
    const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
    render(<RouterProvider router={router} />);
};

describe('App routing and authentication behavior', () => {
    beforeEach(() => {
        fetch.mockReset();
        localStorage.removeItem(AUTH_FOCUSED_MODE_STORAGE_KEY);
        fetch.mockImplementation(async (url: string) => {
            if (url.endsWith('/user-preferences')) {
                return jsonResponse(mockPreferences);
            }
            return response();
        });
    });

    afterEach(() => {
        localStorage.removeItem(AUTH_FOCUSED_MODE_STORAGE_KEY);
    });

    test('renders SignIn at the root path', async () => {
        fetch.mockResolvedValueOnce(response(false, 401)); // access token is unavailable
        fetch.mockResolvedValueOnce(response(false, 401)); // refresh token is unavailable
        renderRoute('/');
        expect(await screen.findByText(/sign in to job tracker/i)).toBeInTheDocument();
    });

    test('redirects to SignIn when accessing protected route while unauthenticated', async () => {
        fetch.mockResolvedValueOnce(response(false, 401));
        fetch.mockResolvedValueOnce(response(false, 401));
        renderRoute('/application/add');

        await waitFor(() => expect(screen.getByText(/sign in to job tracker/i)).toBeInTheDocument());
        expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/authentication/sessions/current`, {
            method: 'GET',
        });
    });

    test('refreshes an expired access token before rendering a protected route', async () => {
        fetch.mockResolvedValueOnce(response(false, 401));
        fetch.mockResolvedValueOnce(jsonResponse({ message: 'Access token refreshed.' }));
        fetch.mockResolvedValueOnce(jsonResponse({ message: 'Authenticated user.' }));
        renderRoute('/application/add');

        await waitFor(() => expect(screen.getByText(/company name/i)).toBeInTheDocument());
        expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/authentication/sessions/refresh`, {
            method: 'POST',
        });
    });

    test('redirects to SignIn when authentication receives the Vite HTML fallback', async () => {
        fetch.mockResolvedValueOnce(response(true, 200, '<!doctype html><html></html>', 'text/html'));
        renderRoute('/application/view');

        await waitFor(() => expect(screen.getByText(/sign in to job tracker/i)).toBeInTheDocument());
        expect(screen.queryByText(/unexpected application error/i)).not.toBeInTheDocument();
    });

    test('shows a retry state when authentication is temporarily unavailable', async () => {
        fetch.mockResolvedValueOnce({
            ...response(false, 503),
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ message: 'Authentication is temporarily unavailable.' }),
        });
        renderRoute('/application/view');

        await waitFor(() =>
            expect(screen.getByRole('heading', { name: /Unable to verify authentication/i })).toBeInTheDocument()
        );
        expect(screen.getByText(/We could not verify your session. Please try again./i)).toBeInTheDocument();
        expect(screen.queryByText(/sign in to job tracker/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
        expect(screen.getByText('Authentication is temporarily unavailable.')).toBeInTheDocument();
    });

    test('renders only the fallback screen while authentication is pending', () => {
        fetch.mockReturnValueOnce(new Promise(() => undefined));
        renderRoute('/application/view');

        expect(screen.getByRole('heading', { name: /checking authentication/i })).toBeInTheDocument();
        expect(screen.getByText(/Please wait while we verify your session./i)).toBeInTheDocument();
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
        expect(screen.queryByText(/job application viewer/i)).not.toBeInTheDocument();
    });

    test('renders AddApplication page when user is authenticated', async () => {
        renderRoute('/application/add');

        await waitFor(() => expect(screen.getByText(/company name/i)).toBeInTheDocument());
        expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/authentication/sessions/current`, {
            method: 'GET',
        });
    });

    test.each(['/application/view', '/application/archive', '/interview/archive'])(
        'renders navigation bar on authenticated route %s',
        async (route) => {
            renderRoute(route);
            await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument());
        }
    );

    test('hides navigation bar on public routes like "/sign-up"', async () => {
        fetch.mockResolvedValueOnce(response(false, 401));
        renderRoute('/sign-up');

        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    test('preserves focused mode when navigating from SignIn to SignUp', async () => {
        fetch.mockImplementation(async (url: string) => {
            if (url.endsWith('/authentication/sessions/current') || url.endsWith('/authentication/sessions/refresh')) {
                return response(false, 401);
            }
            return response();
        });
        renderRoute('/');

        userEvent.click(await screen.findByLabelText('Email', { exact: true }));
        userEvent.click(screen.getByRole('link', { name: /create one/i }));

        expect(await screen.findByRole('heading', { name: /start organising your job search/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /why use job tracker/i })).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: /organise your job search in one place/i })
        ).not.toBeInTheDocument();
        expect(localStorage.getItem(AUTH_FOCUSED_MODE_STORAGE_KEY)).toBe('true');
    });

    test('preserves focused mode when navigating from SignUp to SignIn', async () => {
        fetch.mockImplementation(async (url: string) => {
            if (url.endsWith('/authentication/sessions/current') || url.endsWith('/authentication/sessions/refresh')) {
                return response(false, 401);
            }
            return response();
        });
        renderRoute('/sign-up');

        userEvent.click(await screen.findByLabelText('Password', { exact: true }));
        userEvent.click(screen.getByRole('link', { name: /already have an account/i }));

        expect(await screen.findByRole('heading', { name: /sign in to job tracker/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /why use job tracker/i })).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: /organise your job search in one place/i })
        ).not.toBeInTheDocument();
        expect(localStorage.getItem(AUTH_FOCUSED_MODE_STORAGE_KEY)).toBe('true');
    });

    test('renders the user guide without checking authentication', async () => {
        renderRoute('/user-guide');

        expect(await screen.findByRole('heading', { name: /job tracker user guide/i })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /checking authentication/i })).not.toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    test('redirects /demo to the demo application viewer without checking authentication', async () => {
        renderRoute(routes.demoRoot);

        expect(await screen.findByText(/HorizonAI Labs/i, {}, { timeout: 5000 })).toBeInTheDocument();
        expect(screen.getByRole('navigation')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /demo guide/i })).not.toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    test.each([
        [routes.demoAddApplication, /company name/i],
        [routes.demoViewApplications, /HorizonAI Labs/i],
        [routes.demoAddInterview, /HorizonAI Labs/i],
        [routes.demoViewInterviews, /Atlas RecruitTech/i],
        [routes.demoArchivedApplications, /Riverlane Studio/i],
        [routes.demoArchivedInterviews, /Riverlane Studio/i],
    ])('renders public demo route %s without authentication', async (route, expectedText) => {
        renderRoute(route);

        expect(await screen.findByText(expectedText, {}, { timeout: 5000 })).toBeInTheDocument();
        expect(screen.getByRole('navigation')).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    test('redirects unknown demo routes to the demo application viewer', async () => {
        renderRoute(`${routes.demoRoot}${routes.userGuide}`);

        expect(await screen.findByText(/HorizonAI Labs/i, {}, { timeout: 5000 })).toBeInTheDocument();
        expect(screen.queryByText(/Demo mode mirrors/i)).not.toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    test('demo application state survives navigation between demo routes', async () => {
        renderRoute(routes.demoAddApplication);

        await screen.findByText(/company name/i);
        await userEvent.type(screen.getByLabelText(/company name/i), 'Demo Navigation Company');
        await userEvent.type(screen.getByLabelText(/job title/i), 'Demo Navigation Engineer');
        await userEvent.click(screen.getByRole('button', { name: /^add job application$/i }));

        expect(await screen.findByText('Successfully added a job application!')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /view job applications/i }));
        expect(await screen.findByText(/Demo Navigation Company/i)).toBeInTheDocument();

        await userEvent.click(screen.getByRole('link', { name: /view interviews/i }));
        expect(await screen.findByText(/Atlas RecruitTech/i)).toBeInTheDocument();

        await userEvent.click(screen.getByRole('link', { name: /view job applications/i }));
        expect(await screen.findByText(/Demo Navigation Company/i)).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    test('demo interview application links highlight the corresponding application', async () => {
        renderRoute(routes.demoViewInterviews);

        const atlasHeading = await screen.findByRole('heading', { name: /Atlas RecruitTech/i });
        const atlasCard = atlasHeading.closest('div')?.parentElement;
        expect(atlasCard).toBeTruthy();

        await userEvent.click(
            within(atlasCard as HTMLElement).getByRole('link', {
                name: /click here to review corresponding job application/i,
            })
        );

        expect(await screen.findByText(/Software Engineer, Platform/i)).toBeInTheDocument();
        await waitFor(() => expect(document.getElementById('108')?.className).toContain('highlighted'));
        expect(fetch).not.toHaveBeenCalled();
    });

    test('Exit Demo navigates to sign in without logout or authentication verification', async () => {
        renderRoute(routes.demoViewApplications);

        expect(await screen.findByText(/HorizonAI Labs/i)).toBeInTheDocument();
        fetch.mockClear();

        await userEvent.click(screen.getByRole('link', { name: /exit demo/i }));

        expect(await screen.findByText(/Sign in to job tracker/i)).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    test('displays page 404 not found on unknown routes without checking authentication', () => {
        renderRoute('/addassignment');

        expect(screen.getByText(/^Page not found$/i)).toBeInTheDocument();
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    test('displays the authentication fallback when a route throws an error', async () => {
        const router = createMemoryRouter(
            [
                {
                    element: <div>Broken route</div>,
                    errorElement: appRoutes[0].errorElement,
                    path: '/route-error',
                    loader: () => {
                        throw new Error('Route failed');
                    },
                },
            ],
            { initialEntries: ['/route-error'] }
        );

        render(<RouterProvider router={router} />);

        expect(await screen.findByRole('heading', { name: /unable to verify authentication/i })).toBeInTheDocument();
        expect(screen.getByText(/We could not verify your session. Please try again./i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    test('displays active navigation bar when on dashboard page', async () => {
        renderRoute('/dashboard');
        await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument());

        await waitFor(() => {
            const requestedUrls = fetch.mock.calls.map(([url]) => String(url));
            expect(requestedUrls.filter((url) => url.endsWith('/job-applications/status-counts'))).toHaveLength(1);
            expect(requestedUrls.filter((url) => url.endsWith('/job-interviews'))).toHaveLength(1);
            expect(requestedUrls.filter((url) => url.endsWith('/job-applications/weekly-counts'))).toHaveLength(1);
        });
    });

    test('displays sign in page after clicking logout', async () => {
        renderRoute('/interview/view');
        await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument());
        await userEvent.click(screen.getByText(/logout/i));
        await waitFor(() => expect(screen.getByText(/Sign in to job tracker/i)).toBeInTheDocument());
    });
});
