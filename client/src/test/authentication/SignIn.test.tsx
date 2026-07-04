import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AUTH_FOCUSED_MODE_STORAGE_KEY } from '../../components/authProductIntro/AuthProductIntro';
import SignIn from '../../pages/authentication/signIn/SignIn';
import { render } from '../renderWithToast';
import userEvent from '@testing-library/user-event';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => ({
    ...(await vi.importActual('react-router-dom')),
    useNavigate: () => mockNavigate,
}));

globalThis.fetch = vi.fn();

const mockUnauthenticatedSession = (signInResponse: object) => {
    globalThis.fetch.mockImplementation(async (url: string) => {
        if (url.endsWith('/authentication/sessions/current') || url.endsWith('/authentication/sessions/refresh')) {
            return {
                ok: false,
                status: 401,
            };
        }

        return signInResponse;
    });
};

describe('User sign in flow', () => {
    beforeEach(() => {
        fetch.mockReset();
        fetch.mockResolvedValue({
            headers: new Headers(),
            ok: true,
            status: 200,
            statusText: '',
            url: '',
            json: async () => ({}),
            text: async () => '',
        });
        mockNavigate.mockReset();
        localStorage.removeItem(AUTH_FOCUSED_MODE_STORAGE_KEY);
        localStorage.removeItem('theme');
    });

    afterEach(() => {
        localStorage.removeItem(AUTH_FOCUSED_MODE_STORAGE_KEY);
        localStorage.removeItem('theme');
    });

    test('signs in successfully and redirects to /application/add page', async () => {
        mockUnauthenticatedSession({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ message: 'Successfully signed in' }),
        });

        render(
            <MemoryRouter>
                <SignIn />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/email/i), 'starboy98@hotmail.com');
        userEvent.type(screen.getByLabelText(/^password$/i), '123456');
        userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/authentication/sessions`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' }),
            })
        );

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/application/add'));
    });

    test('shows the generic authentication error when the account does not exist', async () => {
        mockUnauthenticatedSession({
            ok: false,
            status: 401,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ message: 'Invalid email or password.' }),
        });

        render(
            <MemoryRouter>
                <SignIn />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/email/i), 'starboy98@hotmail.com');
        userEvent.type(screen.getByLabelText(/^password$/i), '123456');
        userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/authentication/sessions`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' }),
            })
        );

        await waitFor(() => expect(screen.getByText('Invalid email or password.')).toBeInTheDocument());
        expect(screen.getByRole('button', { name: /why use job tracker/i })).toBeInTheDocument();
        expect(localStorage.getItem(AUTH_FOCUSED_MODE_STORAGE_KEY)).toBe('true');
    });

    test('shows the same generic authentication error for an incorrect password', async () => {
        mockUnauthenticatedSession({
            ok: false,
            status: 401,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ message: 'Invalid email or password.' }),
        });

        render(
            <MemoryRouter>
                <SignIn />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/email/i), 'starboy98@hotmail.com');
        userEvent.type(screen.getByLabelText(/^password$/i), '123456');
        userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/authentication/sessions`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' }),
            })
        );

        await waitFor(() => expect(screen.getByText('Invalid email or password.')).toBeInTheDocument());
    });

    test('links user to sign up page', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <SignIn />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/sign-up');
    });

    test('displays the product introduction and server notice', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <SignIn />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { name: /organise your job search in one place/i })).toBeInTheDocument();
        expect(
            screen.getByText(
                /track applications, manage interviews and monitor your progress without relying on scattered/i
            )
        ).toBeInTheDocument();
        expect(screen.getByText('Track every application and its current status')).toBeInTheDocument();
        expect(screen.getByText('Keep interviews connected to the right application')).toBeInTheDocument();
        expect(screen.getByText('View your job-search progress from one dashboard')).toBeInTheDocument();
        expect(
            screen.getByRole('img', {
                name: /job tracker dashboard showing application and interview statistics/i,
            })
        ).toHaveAttribute('src', expect.stringContaining('light-dashboard.png'));
        expect(screen.getByText('jobtracker.weihungloh.com/dashboard')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /see how it works/i })).toHaveAttribute('href', '/user-guide');
        expect(screen.queryByRole('button', { name: /why use job tracker/i })).not.toBeInTheDocument();
    });

    test('cycles through product previews in route order', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <SignIn />
            </MemoryRouter>
        );

        const previewRoutes = [
            '/application/view',
            '/interview/view',
            '/application/archive',
            '/interview/archive',
            '/dashboard',
        ];

        previewRoutes.forEach((route) => {
            userEvent.click(screen.getByRole('button', { name: /next preview/i }));
            expect(screen.getByText(`jobtracker.weihungloh.com${route}`)).toBeInTheDocument();
        });
    });

    test('uses dark preview images in dark mode', () => {
        localStorage.setItem('theme', 'dark');

        render(
            <MemoryRouter initialEntries={['/']}>
                <SignIn />
            </MemoryRouter>
        );

        expect(
            screen.getByRole('img', {
                name: /job tracker dashboard showing application and interview statistics/i,
            })
        ).toHaveAttribute('src', expect.stringContaining('dark-dashboard.png'));
    });

    test('keeps carousel navigation available in fullscreen and supports both close methods', async () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <SignIn />
            </MemoryRouter>
        );

        const imageButton = screen.getByRole('button', { name: /open dashboard preview in fullscreen/i });
        userEvent.click(imageButton);

        const dialog = screen.getByRole('dialog', { name: /job tracker product preview fullscreen/i });
        expect(document.body).toHaveStyle({ overflow: 'hidden' });
        expect(document.documentElement).toHaveStyle({ overflow: 'hidden' });
        expect(within(dialog).getByRole('button', { name: /close fullscreen preview/i })).toHaveFocus();

        userEvent.click(within(dialog).getByRole('button', { name: /next preview/i }));
        expect(within(dialog).getByText('jobtracker.weihungloh.com/application/view')).toBeInTheDocument();

        userEvent.click(within(dialog).getByRole('button', { name: /jump to archived interview/i }));
        expect(within(dialog).getByText('jobtracker.weihungloh.com/interview/archive')).toBeInTheDocument();

        userEvent.click(within(dialog).getByRole('button', { name: /close fullscreen preview/i }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        await waitFor(() => expect(imageButton).toHaveFocus());
        expect(document.body).not.toHaveStyle({ overflow: 'hidden' });

        userEvent.click(imageButton);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test.each(['Email', 'Password'])('focuses authentication when the %s input receives focus', (label) => {
        render(
            <MemoryRouter>
                <SignIn />
            </MemoryRouter>
        );

        fireEvent.focus(screen.getByLabelText(label, { exact: true }));

        expect(localStorage.getItem(AUTH_FOCUSED_MODE_STORAGE_KEY)).toBe('true');
        expect(
            screen.queryByRole('heading', { name: /organise your job search in one place/i })
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('img', {
                name: /job tracker dashboard showing application and interview statistics/i,
            })
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /see how it works/i })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /sign in to job tracker/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /why use job tracker/i })).toBeInTheDocument();
    });

    test('restores the overview without clearing entered sign-in details', () => {
        render(
            <MemoryRouter>
                <SignIn />
            </MemoryRouter>
        );

        const emailInput = screen.getByLabelText('Email', { exact: true });
        const passwordInput = screen.getByLabelText('Password', { exact: true });
        userEvent.type(emailInput, 'user@example.com');
        userEvent.type(passwordInput, 'saved password');
        userEvent.click(screen.getByRole('button', { name: /show password/i }));

        expect(screen.getByRole('button', { name: /why use job tracker/i })).toBeInTheDocument();
        userEvent.click(screen.getByRole('button', { name: /why use job tracker/i }));

        expect(localStorage.getItem(AUTH_FOCUSED_MODE_STORAGE_KEY)).toBeNull();
        expect(screen.getByRole('heading', { name: /organise your job search in one place/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /see how it works/i })).toBeInTheDocument();
        expect(emailInput).toHaveValue('user@example.com');
        expect(passwordInput).toHaveValue('saved password');
        expect(passwordInput).toHaveAttribute('type', 'text');
        expect(screen.queryByRole('button', { name: /why use job tracker/i })).not.toBeInTheDocument();
    });

    test('restores focused mode immediately from localStorage', () => {
        localStorage.setItem(AUTH_FOCUSED_MODE_STORAGE_KEY, 'true');

        render(
            <MemoryRouter>
                <SignIn />
            </MemoryRouter>
        );

        expect(screen.getByRole('button', { name: /why use job tracker/i })).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: /organise your job search in one place/i })
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /see how it works/i })).not.toBeInTheDocument();
    });
});
