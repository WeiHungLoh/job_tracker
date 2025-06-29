import { render, screen, waitFor } from '@testing-library/react'
import AddApplication from './AddApplication.js'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

global.fetch = jest.fn()
global.alert = jest.fn()

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
        await waitFor(() => expect(screen.getByTestId('noti')).toBeInTheDocument(), { timeOut: 2500 })
    })

    test('shows alert message due to company name not filled in', async () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        )

        userEvent.type(screen.getByLabelText(/input job title/i), 'Cleaner')
        userEvent.click(screen.getByRole('button', { name: /add job application/i }))

        await waitFor(() => expect(alert)
            .toHaveBeenCalledWith('Please enter company name and job title before adding a job application'))
    })
})
