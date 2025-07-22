import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ViewArchivedApplication from './ViewArchivedApplication.js'
import useFetchData from '../useFetchData.js'
import userEvent from '@testing-library/user-event'

global.fetch = jest.fn()
jest.mock('../useFetchData.js')
const refetchMock = jest.fn()

const mockConfirm = jest.fn()
jest.mock('material-ui-confirm', () =>
({
    useConfirm: () => mockConfirm
}))

describe('Archived job application viewing flow', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        fetch.mockReset()

        useFetchData.mockReturnValue({
            data: [
                {
                    archived_job_id: '1',
                    company_name: 'ABC Pte Ltd',
                    job_title: 'Software Engineer',
                    job_location: 'Remote',
                    application_date: '2025-06-20T00:00:00Z',
                    job_status: 'Applied',
                    edit_status: false,
                    job_posting_url: 'https://jobstreet.com'
                }
            ],
            refetch: refetchMock
        })
    })

    test('displays archived job application details and action buttons', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        )

        expect(screen.queryByText(/no archived job application with that job status found/i)).not.toBeInTheDocument()
        expect(screen.getByText(/job application viewer/i)).toBeInTheDocument()
        expect(screen.getByText(/ABC Pte Ltd/i)).toBeInTheDocument()
        expect(screen.getByText(/software engineer/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /unarchive/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /delete all archived applications/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeInTheDocument()
        expect(screen.getByText(/filter by/i)).toBeInTheDocument()
    })

    test('deletes application after user confirms', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        )

        // Simulates user confirming delete
        mockConfirm.mockResolvedValueOnce({ confirmed: true })

        // Simulates user clicking delete button and clicking confirm delete
        userEvent.click(screen.getByRole('button', { name: 'Delete' }))

        await waitFor(() => expect(mockConfirm).toHaveBeenCalledWith({
            title: 'Confirm Deletion',
            description: 'Are you sure you want to delete this archived job application? This action is permanent and cannot be undone.',
            confirmationText: 'Delete',
            cancellationText: 'Cancel',
            confirmationButtonProps: { autoFocus: true }
        }))

        // Simulates fetching of data after confirming delete
        fetch.mockResolvedValueOnce({
            ok: true,
            text: 'Deleted archived application'
        })

        await waitFor(() => expect(fetch).toHaveBeenCalledWith(
            `${process.env.REACT_APP_API_URL}/archivedapplication/1`, {
            method: 'DELETE',
            credentials: 'include'
        }
        ))

        await waitFor(() => expect(refetchMock).toHaveBeenCalled())
    })

    test('deletes all archived applications after user confirms', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        )

        // Simulates user confirming delete
        mockConfirm.mockResolvedValueOnce({ confirmed: true })

        // Simulates user clicking delete button and clicking confirm delete
        userEvent.click(screen.getByRole('button', { name: 'Delete all archived applications' }))

        await waitFor(() => expect(mockConfirm).toHaveBeenCalledWith(
            {
                title: 'Confirm Deletion',
                description: 'Are you sure you want to delete all archived job applications? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            }
        ))

        // Simulates fetching of data after confirming delete
        fetch.mockResolvedValueOnce({
            ok: true,
            text: 'Deleted all archived applications'
        })

        await waitFor(() => expect(fetch).toHaveBeenCalledWith(
            `${process.env.REACT_APP_API_URL}/archivedapplication/deleteall`,
            {
                method: 'DELETE',
                credentials: 'include'
            }
        ))

        await waitFor(() => expect(refetchMock).toHaveBeenCalled())
    })

    test('unarchive job application', async () => {
        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        )

        expect(screen.getByText(/job application viewer/i)).toBeInTheDocument()
        expect(screen.getByText(/ABC Pte Ltd/i)).toBeInTheDocument()
        expect(screen.getByText(/software engineer/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /unarchive/i })).toBeInTheDocument()

        userEvent.click(screen.getByRole('button', { name: /unarchive/i }))

        await waitFor(() => expect(fetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/archivedapplication/unarchive`,
            {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ archivedJobId: '1' })
            }
        ))
    })

    test('renders message for empty application list on successful fetch with no data', () => {
        useFetchData.mockReturnValue({
            data: [],
            refetch: refetchMock
        })

        render(
            <MemoryRouter>
                <ViewArchivedApplication />
            </MemoryRouter>
        )

        expect(screen.getByText(/no archived job application with that job status found/i)).toBeInTheDocument()
    })
})
