import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUp from '../../pages/authentication/signUp/SignUp';
import { render } from '../renderWithToast';
import userEvent from '@testing-library/user-event';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => ({
    ...(await vi.importActual('react-router-dom')),
    useNavigate: () => mockNavigate,
}));

globalThis.fetch = vi.fn();

const mockUnauthenticatedSession = (signUpResponse: object) => {
    globalThis.fetch.mockImplementation(async (url: string) => {
        if (url.endsWith('/authentication/sessions/current') || url.endsWith('/authentication/sessions/refresh')) {
            return {
                ok: false,
                status: 401,
            };
        }

        return signUpResponse;
    });
};

describe('User sign up flow', () => {
    beforeEach(() => {
        fetch.mockReset();
        mockNavigate.mockReset();
    });

    test('signs up successfully and redirects to SignIn page', async () => {
        const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

        mockUnauthenticatedSession({
            ok: true,
            status: 201,
            headers: new Headers({ 'content-type': 'text/plain' }),
            text: async () => 'User successfully registered',
        });

        render(
            <MemoryRouter>
                <SignUp />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/email/i), 'starboy98@hotmail.com');
        userEvent.type(screen.getByLabelText(/^password$/i), '123456');
        userEvent.click(screen.getByRole('button', { name: /sign up/i }));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/authentication/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' }),
            })
        );

        await waitFor(() =>
            expect(screen.getByText('Sign up successful! Redirecting you to login page')).toBeInTheDocument()
        );

        const redirectTimer = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 1500);
        expect(redirectTimer).toBeDefined();

        const redirectToSignIn = redirectTimer?.[0];
        expect(redirectToSignIn).toBeTypeOf('function');
        if (typeof redirectToSignIn === 'function') {
            redirectToSignIn();
        }

        expect(mockNavigate).toHaveBeenCalledWith('/');
        setTimeoutSpy.mockRestore();
    });

    test('shows an error toast when the account already exists', async () => {
        mockUnauthenticatedSession({
            ok: false,
            status: 409,
            headers: new Headers({ 'content-type': 'text/plain' }),
            text: async () => 'User already exists',
        });

        render(
            <MemoryRouter>
                <SignUp />
            </MemoryRouter>
        );

        userEvent.type(screen.getByLabelText(/email/i), 'starboy98@hotmail.com');
        userEvent.type(screen.getByLabelText(/^password$/i), '123456');
        userEvent.click(screen.getByRole('button', { name: /sign up/i }));

        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/authentication/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' }),
            })
        );

        await waitFor(() => expect(screen.getByText('User already exists')).toBeInTheDocument());
    });

    test('links user to sign in page', () => {
        render(
            <MemoryRouter initialEntries={['/sign-up']}>
                <SignUp />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /already have an account/i })).toHaveAttribute('href', '/');
    });
});
