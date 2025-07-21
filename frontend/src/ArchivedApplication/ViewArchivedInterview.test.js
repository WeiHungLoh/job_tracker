import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ViewArchivedInterview from './ViewArchivedInterview.js'
import useFetchData from '../useFetchData.js'
import userEvent from '@testing-library/user-event'

global.fetch = jest.fn()
const refetchMock = jest.fn()
jest.mock('../useFetchData.js')

const mockConfirm = jest.fn()
jest.mock('material-ui-confirm', () =>
({
    useConfirm: () => mockConfirm
}))

describe('Archived job interview viewer flow', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        fetch.mockReset()

        useFetchData.mockReturnValue({
            data: [
                {
                    archived_job_id: '1',
                    archived_interview_id: '1',
                    user_id: '1',
                    company_name: 'ABC Pte Ltd',
                    job_title: 'Software Engineer',
                    interview_location: 'Changi Business Park',
                    interview_type: 'HR',
                    notes: 'Bring resume',
                    interview_date: '2025-06-20T00:00:00Z'
                }
            ],
            refetch: refetchMock
        })
    })

    test('displays job interview details and action buttons', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>
        )

        expect(screen.queryByText(/no job interview found/)).not.toBeInTheDocument()
        expect(screen.getByText(/abc pte ltd/i)).toBeInTheDocument()
        expect(screen.getByText(/software engineer/i)).toBeInTheDocument()
        expect(screen.getByText(/changi business park/i))
        expect(screen.getByText(/hr/i)).toBeInTheDocument()
        expect(screen.getByText(/bring resume/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /delete all archived interviews/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeInTheDocument()
    })

    test('deletes archived interview after use confirms', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>
        )

        // Simulates user confirming delete
        mockConfirm.mockResolvedValueOnce({ confirmed: true })
        // Simulates user clicking delete button and clicking confirm delete
        userEvent.click(screen.getByRole('button', { name: 'Delete' }))

        await waitFor(() => expect(mockConfirm).toHaveBeenCalledWith(
            {
                title: 'Confirm Deletion',
                description: 'Are you sure you want to delete this archived job interview? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true }
            }
        ))

        // Simulates fetching of data after confirming delete
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: 'Deleted archived interview'
        })

        await waitFor(() => expect(fetch).toHaveBeenCalledWith(
            `${process.env.REACT_APP_API_URL}/archivedinterview/1`, {
            method: 'DELETE',
            credentials: 'include'
        }
        ))

        await waitFor(() => expect(refetchMock).toHaveBeenCalled)
    })

    test('deletes all archived interviews after use confirms', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>
        )

        // Simulates user confirming delete
        mockConfirm.mockResolvedValueOnce({ confirmed: true })
        // Simulates user clicking delete button and clicking confirm delete
        userEvent.click(screen.getByRole('button', { name: 'Delete all archived interviews' }))

        await waitFor(() => expect(mockConfirm).toHaveBeenCalledWith(
            {
                title: 'Confirm Deletion',
                description: 'Are you sure you want to delete all archived job interviews? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            }
        ))

        // Simulates fetching of data after confirming delete
        fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: 'Deleted all archived interviews'
        })

        await waitFor(() => expect(fetch).toHaveBeenCalledWith(
            `${process.env.REACT_APP_API_URL}/archivedinterview/deleteall`,
            {
                method: 'DELETE',
                credentials: 'include'
            }
        ))

        await waitFor(() => expect(refetchMock).toHaveBeenCalled)
    })

    test('renders message for empty interview list on successful fetch with no data', () => {
        useFetchData.mockReturnValue({
            data: [],
            refetch: refetchMock
        })

        render(
            <MemoryRouter>
                <ViewArchivedInterview />
            </MemoryRouter>
        )

        expect(screen.getByText(/no archived job interview found/i)).toBeInTheDocument()
    })
})
