import { screen, waitFor } from '@testing-library/react'
import AddApplication from '../../pages/jobApplication/addApplication/AddApplication'
import { MemoryRouter } from 'react-router-dom'
import { render } from '../renderWithToast'
import userEvent from '@testing-library/user-event'

globalThis.fetch = vi.fn()
globalThis.alert = vi.fn()

describe('User add application flow', () => {
    // Resets the state of fetch and alert
    beforeEach(() => {
        fetch.mockReset()
        alert.mockReset()
    })

    test('successfully adds an application and a notification message is shown', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            text: async () => 'Successfully added a job application!'
        })

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        )

        userEvent.type(screen.getByLabelText(/input company name/i), 'ABC Pte Ltd')
        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner')
        userEvent.click(screen.getByRole('button', { name: /add job application/i }))

        await waitFor(() => expect(fetch).toHaveBeenCalled())
        await waitFor(() => expect(screen.getByTestId('toast')).toBeInTheDocument())
    })

    test('shows alert message due to company name not filled in', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        )

        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner')
        userEvent.click(screen.getByRole('button', { name: /add job application/i }))

        await waitFor(() => expect(screen.getByText(
            'Please enter company name and job title before adding a job application'
        )).toBeInTheDocument())
    })

    test('shows the backend error as a notification without changing the original form behavior', async () => {
        fetch.mockResolvedValueOnce({
            headers: new Headers({ 'content-type': 'text/plain' }),
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Failed to add a job application'
        })

        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        )

        userEvent.type(screen.getByLabelText(/input company name/i), 'ABC Pte Ltd')
        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner')
        userEvent.click(screen.getByRole('button', { name: /add job application/i }))

        await waitFor(() => expect(screen.getByText('Failed to add a job application')).toBeInTheDocument())
        expect(screen.getByLabelText(/input company name/i)).toHaveValue('')
        expect(screen.getByLabelText(/input job title/i)).toHaveValue('')
    })
})
