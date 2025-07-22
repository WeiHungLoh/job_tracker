import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ViewApplication from './ViewApplication.js'
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

describe('Job application viewing flow', () => {

  beforeEach(() => {
    jest.resetAllMocks()
    fetch.mockReset()

    useFetchData.mockReturnValue({
      data: [
        {
          job_id: '1',
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

  test('displays job application details and action buttons', async () => {
    render(
      <MemoryRouter>
        <ViewApplication />
      </MemoryRouter>
    )
    expect(screen.queryByText(/no job application with that job status found/i)).not.toBeInTheDocument()
    expect(screen.getByText(/job application viewer/i)).toBeInTheDocument()
    expect(screen.getByText(/ABC Pte Ltd/i)).toBeInTheDocument()
    expect(screen.getByText(/software engineer/i)).toBeInTheDocument()
    expect(screen.getByText(/job status/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit status/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add new application/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete all/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeInTheDocument()
    expect(screen.getByText(/unhide archive button/i)).toBeInTheDocument()
    expect(screen.getByText(/filter by/i)).toBeInTheDocument()
  })

  test('button should switch to Save Changes button after toggle', async () => {
    render(
      <MemoryRouter>
        <ViewApplication />
      </MemoryRouter>
    )

    userEvent.click(screen.getByRole('button', { name: /edit status/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/application/toggleeditstatus`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-type': 'application/json' },
          body: JSON.stringify({ jobId: '1' })
        }
      )
    })

    await waitFor(() => expect(refetchMock).toHaveBeenCalled())

    useFetchData.mockReturnValue({
      data: [
        {
          job_id: '1',
          company_name: 'ABC Pte Ltd',
          job_title: 'Software Engineer',
          job_location: 'Remote',
          application_date: '2025-06-20T00:00:00Z',
          job_status: 'Applied',
          edit_status: true,
          job_posting_url: 'https://jobstreet.com'
        }
      ],
      refetch: refetchMock
    })

    render(
      <MemoryRouter>
        <ViewApplication />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })
  })

  test('deletes application after user confirms', async () => {
    render(
      <MemoryRouter>
        <ViewApplication />
      </MemoryRouter>
    )

    // Simulates user confirming delete
    mockConfirm.mockResolvedValueOnce({ confirmed: true })

    // Simulates user clicking delete button and clicking confirm delete
    userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mockConfirm).toHaveBeenCalledWith({
      title: 'Confirm Deletion',
      description: 'Are you sure you want to delete this job application? This action is permanent and cannot be undone.',
      confirmationText: 'Delete',
      cancellationText: 'Cancel',
      confirmationButtonProps: { autoFocus: true }
    }))

    // Simulates fetching of data after confirming delete
    fetch.mockResolvedValueOnce({
      ok: true,
      text: 'Deleted application'
    })

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/application/1`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ applicationId: '1' })
    }
    ))

    await waitFor(() => expect(refetchMock).toHaveBeenCalled())
  })

  test('renders message for empty application list on successful fetch with no data', () => {
    useFetchData.mockReturnValue({
      data: [],
      refetch: refetchMock
    })

    render(
      <MemoryRouter>
        <ViewApplication />
      </MemoryRouter>
    )

    expect(screen.getByText(/no job application with that job status found/i)).toBeInTheDocument()
  })

  test('deletes all application after user confirms', async () => {
    render(
      <MemoryRouter>
        <ViewApplication />
      </MemoryRouter>
    )

    // Simulates user confirming delete
    mockConfirm.mockResolvedValueOnce({ confirmed: true })

    // Simulates user clicking delete button and clicking confirm delete
    userEvent.click(screen.getByRole('button', { name: 'Delete all applications' }))

    await waitFor(() => expect(mockConfirm).toHaveBeenCalledWith({
      title: 'Confirm Deletion',
      description: 'Are you sure you want to delete all job applications? This action is permanent and cannot be undone.',
      confirmationText: 'Delete All',
      cancellationText: 'Cancel',
    }))

    // Simulates fetching of data after confirming delete
    fetch.mockResolvedValueOnce({
      ok: true,
      text: 'Deleted all applications'
    })

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/application/deleteall`,
      {
        method: 'DELETE',
        credentials: 'include'
      }
    ))

    await waitFor(() => expect(refetchMock).toHaveBeenCalled())
  })

  test('renders message for empty application list on successful fetch with no data', () => {
    useFetchData.mockReturnValue({
      data: [],
      refetch: refetchMock
    })

    render(
      <MemoryRouter>
        <ViewApplication />
      </MemoryRouter>
    )

    expect(screen.getByText(/no job application with that job status found/i)).toBeInTheDocument()
  })
})
