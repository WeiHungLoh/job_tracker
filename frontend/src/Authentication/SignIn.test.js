import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SignIn from './SignIn.js'
import userEvent from '@testing-library/user-event'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

global.fetch = jest.fn()

global.alert = jest.fn()

describe('User sign in flow', () => {
    // Resets the state of fetch and mockNavigate
    beforeEach(() => {
        fetch.mockReset()
        mockNavigate.mockReset()
        alert.mockReset()
    })

    test('signs in successfully and redirects to /addapplication page', async () => {
        global.fetch
            // For ping GET request to backemd
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => 'testing'
            })
            // For POST request to backend
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ message: 'Successfully signed in' })
            })

        render(
            <MemoryRouter>
                <SignIn />
            </MemoryRouter>
        )

        userEvent.type(screen.getByLabelText(/email/i), 'starboy98@hotmail.com')
        userEvent.type(screen.getByLabelText(/password/i), '123456')
        userEvent.click(screen.getByRole('button', { name: /sign in/i }))

        // Checks that ping API request has been called
        await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/ping/ping`))

        // Checks that a fetch request that matches the format below has been
        // called after filling in email and password
        await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/auth/signin`,
            {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' })
            }
        ))

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/addapplication'))
    })

    test('shows alert on failed sign in due to non-existent email', async () => {
        global.fetch
            // For ping GET request to backemd
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => 'testing'
            })
            // For POST request to backend
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ message: 'User does not exist. Please create an account' })
            })

        render(
            <MemoryRouter>
                <SignIn />
            </MemoryRouter>
        )

        userEvent.type(screen.getByLabelText(/email/i), 'starboy98@hotmail.com')
        userEvent.type(screen.getByLabelText(/password/i), '123456')
        userEvent.click(screen.getByRole('button', { name: /sign in/i }))

        await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/ping/ping`))

        // Checks that a fetch request that matches the format below has been
        // called after filling in email and password
        await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/auth/signin`,
            {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' })
            }
        ))

        await waitFor(() => expect(alert).toHaveBeenCalledWith('Failed to sign in: '
            + 'User does not exist. Please create an account'))
    })

    test('shows alert on failed sign in due to incorrect password', async () => {
        global.fetch
            // For ping GET request to backemd
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => 'testing'
            })
            // For POST request to backend
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ message: 'Incorrect password' })
            })

        render(
            <MemoryRouter>
                <SignIn />
            </MemoryRouter>
        )

        userEvent.type(screen.getByLabelText(/email/i), 'starboy98@hotmail.com')
        userEvent.type(screen.getByLabelText(/password/i), '123456')
        userEvent.click(screen.getByRole('button', { name: /sign in/i }))

        await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/ping/ping`))

        // Checks that a fetch request that matches the format below has been
        // called after filling in email and password
        await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/auth/signin`,
            {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' })
            }
        ))

        await waitFor(() => expect(alert).toHaveBeenCalledWith('Failed to sign in: '
            + 'Incorrect password'))
    })
})
