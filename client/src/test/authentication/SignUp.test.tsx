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

describe('User sign up flow', () => {
    // Resets the state of fetch and mockNavigate
    beforeEach(() => {
        fetch.mockReset();
        mockNavigate.mockReset();
    });

    test('signs up successfully and redirects to SignIn page', async () => {
        globalThis.fetch
            // For verify GET request — must fail so the page stays on sign up
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
            })
            // Mocks the text response returned by the sign-up endpoint.
            .mockResolvedValueOnce({
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

        // Checks that a fetch request that matches the format below has been
        // called after filling in email and password
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
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'), { timeout: 2000 });
    });

    test('shows alert on failed sign-up due to existing user', async () => {
        globalThis.alert = vi.fn();

        globalThis.fetch
            // For verify GET request — must fail so the page stays on sign up
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
            })
            .mockResolvedValueOnce({
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

        // Checks that a fetch request that matches the format below has been
        // called after filling in email and password
        await waitFor(() =>
            expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/authentication/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' }),
            })
        );

        await waitFor(() => expect(screen.getByText('Failed to sign up: User already exists')).toBeInTheDocument());
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
