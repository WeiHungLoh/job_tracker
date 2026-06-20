import { MemoryRouter } from 'react-router-dom';
import UserGuide from '../../pages/userGuide/UserGuide';
import { render } from '../renderWithToast';
import { screen } from '@testing-library/react';

describe('renders user guide properly', () => {
    test('displays user guide', () => {
        render(
            <MemoryRouter initialEntries={['/userGuide']}>
                <UserGuide />
            </MemoryRouter>
        );
        expect(screen.getByTestId('ug')).toBeInTheDocument();
    });
});
