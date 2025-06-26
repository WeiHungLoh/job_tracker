import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AddApplication from './AddApplication.js'

describe('Test for add application component', () => {
    test('Test for header', () => {
        render(
            <MemoryRouter>
                <AddApplication />
            </MemoryRouter>
        )
        const headerMessage = screen.getByText('Add a job application')
        expect(headerMessage).toBeInTheDocument()
    })
})
