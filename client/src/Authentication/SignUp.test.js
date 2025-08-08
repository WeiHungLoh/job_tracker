import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SignUp from './SignUp.js'
import userEvent from '@testing-library/user-event'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

global.fetch = jest.fn()

describe('User sign up flow', () => {
    // Resets the state of fetch and mockNavigate
    beforeEach(() => {
        fetch.mockReset()
        mockNavigate.mockReset()
    })

    test('signs up successfully and redirects to SignIn page', async () => {
        // Mocks a successful user registered fetch response with text since res.text is used in SignUp.js
        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
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
        await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/authentication/signup`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' })
            }
        ))

        // Checks that sign up successful notification to appear followed by being directed to sign in page
        await waitFor(() => expect(screen.getByTestId('noti')).toBeInTheDocument(), { timeout: 1500 })
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'), { timeout: 2000 })
    })

    test('shows alert on failed sign-up due to existing user', async () => {
        global.alert = jest.fn()

        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 201,
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
        await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/authentication/signup`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'starboy98@hotmail.com', password: '123456' })
            }
        ))

        // Checks that an alert pops up informing user that user with that email already exists
        await waitFor(() => expect(alert).toHaveBeenCalledWith('Failed to sign up: User already exists'))
    })

    test('redirects user to sign in page', async () => {
        render(
            <MemoryRouter initialEntries={['/signup']}>
                <SignUp />
            </MemoryRouter>
        )

        userEvent.click(screen.getByText(/Already have an account?/i))
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'), { timeout: 2000 })
    })
})

