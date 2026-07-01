import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
        expect(screen.getByText('Track every application and its current status')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /see how it works/i })).toHaveAttribute('href', '/user-guide');
        expect(screen.queryByRole('button', { name: /why use job tracker/i })).not.toBeInTheDocument();
    });
});
