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

globalThis.alert = vi.fn();

describe('User sign in flow', () => {
    // Resets the state of fetch and mockNavigate
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
        alert.mockReset();
    });

    test('signs in successfully and redirects to /application/add page', async () => {
        globalThis.fetch.mockResolvedValueOnce({ ok: true, status: 200, text: async () => '' }).mockResolvedValueOnce({
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

    test('shows alert on failed sign in due to non-existent email', async () => {
        globalThis.fetch
            .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '' })
            .mockResolvedValueOnce({ ok: false, status: 401 })
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({ message: 'User does not exist. Please create an account' }),
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

        await waitFor(() =>
            expect(screen.getByText('User does not exist. Please create an account')).toBeInTheDocument()
        );
    });

    test('shows alert on failed sign in due to incorrect password', async () => {
        globalThis.fetch
            .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '' })
            .mockResolvedValueOnce({ ok: false, status: 401 })
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({ message: 'Incorrect password' }),
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

        await waitFor(() => expect(screen.getByText('Incorrect password')).toBeInTheDocument());
    });

    test('links user to sign up page', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <SignIn />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/sign-up');
    });
});
