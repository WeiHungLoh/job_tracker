import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import AddInterview from './AddInterview.js'
import ViewApplication from '../JobApplication/ViewApplication.js'
import userEvent from '@testing-library/user-event'

global.fetch = jest.fn()

describe('AddInterview page', () => {
    beforeEach(() => {
  fetch.mockReset()
})

    test('renders correctly when state is passed', async () => {
        const mockApp = {
            job_id: 1,
            company_name: 'IRAS',
            job_title: 'Data Engineer',
        }

        render(
            <MemoryRouter
                initialEntries={[
                    { pathname: '/addinterview', state: { app: mockApp } }
                ]}
            >
                <Routes>
                    <Route path="/addinterview" element={<AddInterview />} />
                    <Route path="/viewapplications" element={<ViewApplication />} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText(/you are adding an interview for/i)).toBeInTheDocument()
        expect(screen.getByText(/iras/i)).toBeInTheDocument()
        expect(screen.getByText(/data engineer/i)).toBeInTheDocument()

        userEvent.type(screen.getByLabelText('Input Interview Date'), '2025-08-03T14:30')
        userEvent.type(screen.getByLabelText('Input Interview Location'), 'Zoom')
        userEvent.type(screen.getByLabelText('Input Interview Type (optional)'), 'HR')
        userEvent.type(screen.getByLabelText('Input Additional Notes (optional)'), '2nd round')
        userEvent.click(screen.getByTestId('add-interview'))

    })

    test('redirects to /viewapplication when no state is passed', async () => {
        render(
            <MemoryRouter initialEntries={['/addinterview']}>
                <Routes>
                    <Route path="/addinterview" element={<AddInterview />} />
                    <Route path="/viewapplications" element={<ViewApplication />} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText(/job application viewer/i)).toBeInTheDocument()
    })
})
