import useFetchData from '../useFetchData.js'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ViewApplication from './ViewApplication'

jest.mock('../useFetchData.js')

test('renders ViewApplication with mocked data', () => {
  useFetchData
    .mockReturnValue({
      data: [
        {
          job_id: '1',
          company_name: 'Test Company',
          job_title: 'Software Engineer',
          job_location: 'Remote',
          application_date: '2025-06-20T00:00:00Z',
          job_status: 'Applied',
          edit_status: false,
          job_posting_url: 'https://example.com/job1'
        }
      ],
      refetch: jest.fn()
    })

  render(
    <MemoryRouter>
      <ViewApplication />
    </MemoryRouter>
  )

  expect(screen.getByText(/job application viewer/i)).toBeInTheDocument()
  expect(screen.getByText(/test company/i)).toBeInTheDocument()
  expect(screen.getByText(/software engineer/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /add new application/i })).toBeInTheDocument()
})
