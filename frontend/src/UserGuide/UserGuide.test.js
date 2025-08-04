import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import UserGuide from './UserGuide.js'

describe('renders user guide properly', () => {
    test('displays user guide', () => {
        render(
            <MemoryRouter initialEntries={['/userguide']}>
                <UserGuide />
            </MemoryRouter>
        )
        expect(screen.getByTestId('ug')).toBeInTheDocument()
    })
})