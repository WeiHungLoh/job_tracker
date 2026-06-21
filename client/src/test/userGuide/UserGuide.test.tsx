import { MemoryRouter } from 'react-router-dom';
import UserGuide from '../../pages/userGuide/UserGuide';
import { render } from '../renderWithToast';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('renders user guide properly', () => {
    test('displays user guide', async () => {
        render(
            <MemoryRouter initialEntries={['/userGuide']}>
                <UserGuide />
            </MemoryRouter>
        );
        expect(screen.getByTestId('ug')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute('href', '/sign-in');
        expect(screen.getByText(/quick visual overview/i)).toBeVisible();

        await userEvent.click(screen.getByRole('button', { name: /adding and managing applications/i }));

        expect(screen.getByText(/enter the company name/i)).toBeVisible();
        expect(screen.getByText(/quick visual overview/i)).not.toBeVisible();
    });
});
