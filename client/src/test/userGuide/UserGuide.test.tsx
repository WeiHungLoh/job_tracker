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
        expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute('href', '/');
        expect(screen.getByText(/quick visual overview/i)).not.toBeVisible();

        screen.getAllByRole('button').forEach((button) => {
            expect(button).toHaveAttribute('aria-expanded', 'false');
        });

        await userEvent.click(screen.getByRole('button', { name: /account security/i }));

        expect(screen.getByText(/passwords must contain 15–64 characters/i)).toBeVisible();

        await userEvent.click(screen.getByRole('button', { name: /dashboard/i }));

        expect(screen.getByText(/quick visual overview/i)).toBeVisible();

        await userEvent.click(screen.getByRole('button', { name: /adding and managing applications/i }));

        expect(screen.getByText(/enter the company name/i)).toBeVisible();
        expect(screen.getByText(/job URLs are limited to 2048 characters/i)).toBeVisible();
        expect(screen.getByText(/quick visual overview/i)).not.toBeVisible();

        await userEvent.click(screen.getByRole('button', { name: /^interviews$/i }));

        expect(screen.getByText(/interview location is separate from job location/i)).toBeVisible();
        expect(screen.getByText(/interview notes are optional and limited to 3000 characters/i)).toBeVisible();
    });
});
