import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SignUp from '../../pages/authentication/signUp/SignUp'
import { render } from '../renderWithToast'
import userEvent from '@testing-library/user-event'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => ({
    ...await vi.importActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

globalThis.fetch = vi.fn()

describe('User sign up flow', () => {
    // Resets the state of fetch and mockNavigate
    beforeEach(() => {
        fetch.mockReset()
        mockNavigate.mockReset()
    })

    test('signs up successfully and redirects to SignIn page', async () => {
        // Mocks a successful user registered fetch response with text since res.text is used in SignUp.js
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            headers: new Headers({ 'content-type': 'text/plain' }),
            text: async () => 'User successfully registered'
        })

        render(
            <MemoryRouter>
                <SignUp />
            </MemoryRouter>
        )

        userEvent.type(screen.getByLabelText(/email/i), 'starboy98@hotmail.com')
        userEvent.type(screen.getByLabelText(/password/i), '123456')
        userEvent.click(screen.getByRole('button', { name: /sign up/i }))

        // Checks that a fetch request that matches the format below has been
        // called after filling in email and password
        await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/authentication/users`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' })
            }
        ))

        // Checks that sign up successful notification to appear followed by being directed to sign in page
        await waitFor(() => expect(screen.getByText(
            'Sign up succesful! Redirecting you to login page'
        )).toBeInTheDocument())
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/authentication/sign-in'), { timeout: 2000 })
    })

    test('shows alert on failed sign-up due to existing user', async () => {
        globalThis.alert = vi.fn()

        globalThis.fetch.mockResolvedValueOnce({
            ok: false,
            status: 201,
            headers: new Headers({ 'content-type': 'text/plain' }),
            text: async () => 'User already exists'
        })

        render(
            <MemoryRouter>
                <SignUp />
            </MemoryRouter>
        )

        userEvent.type(screen.getByLabelText(/email/i), 'starboy98@hotmail.com')
        userEvent.type(screen.getByLabelText(/password/i), '123456')
        userEvent.click(screen.getByRole('button', { name: /sign up/i }))

        // Checks that a fetch request that matches the format below has been
        // called after filling in email and password
        await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/authentication/users`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' })
            }
        ))

        await waitFor(() => expect(screen.getByText(
            'Failed to sign up: User already exists'
        )).toBeInTheDocument())
    })

    test('redirects user to sign in page', async () => {
        render(
            <MemoryRouter initialEntries={['/authentication/sign-up']}>
                <SignUp />
            </MemoryRouter>
        )

        userEvent.click(screen.getByText(/Already have an account?/i))
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/authentication/sign-in'), { timeout: 2000 })
    })
})
