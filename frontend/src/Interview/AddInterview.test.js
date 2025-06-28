import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import AddInterview from './AddInterview.js'
import ViewApplication from '../JobApplication/ViewApplication.js'

describe('AddInterview page', () => {
    test('renders correctly when state is passed', () => {
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
                <AddInterview />
            </MemoryRouter>
        )

        expect(screen.getByText(/you are adding an interview for/i)).toBeInTheDocument()
        expect(screen.getByText(/iras/i)).toBeInTheDocument()
        expect(screen.getByText(/data engineer/i)).toBeInTheDocument()
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
