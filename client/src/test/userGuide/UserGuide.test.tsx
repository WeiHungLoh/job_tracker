import { MemoryRouter } from 'react-router-dom';
import UserGuide from '../../pages/userGuide/UserGuide';
import { render } from '../renderWithToast';
import { routes } from '../../routes';
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
        expect(screen.getByText(/interview rate counts applications currently at/i)).toBeVisible();

        await userEvent.click(screen.getByRole('button', { name: /demo mode/i }));

        expect(screen.getByText(/demo mode mirrors the signed-in job tracker flows/i)).toBeVisible();
        expect(screen.getByRole('link', { name: /explore demo/i })).toHaveAttribute(
            'href',
            routes.demoViewApplications
        );
        expect(screen.getByText(/no account, authentication, backend request or database write/i)).toBeVisible();

        await userEvent.click(screen.getByRole('button', { name: /adding and managing applications/i }));

        expect(screen.getByText(/enter the company name/i)).toBeVisible();
        expect(screen.getByText(/job URLs are limited to 2048 characters/i)).toBeVisible();
        expect(screen.getByText(/standard card list and the board layout/i)).toBeVisible();
        expect(screen.getByText(/active application board groups cards by status/i)).toBeVisible();
        expect(screen.getByText(/quick visual overview/i)).not.toBeVisible();

        await userEvent.click(screen.getByRole('button', { name: /^interviews$/i }));

        expect(screen.getByText(/interview location is separate from job location/i)).toBeVisible();
        expect(screen.getByText(/interview notes are optional and limited to 3000 characters/i)).toBeVisible();

        await userEvent.click(screen.getByRole('button', { name: /archive mode/i }));

        expect(screen.getByText(/archived board cards use the same visual format/i)).toBeVisible();

        await userEvent.click(screen.getByRole('button', { name: /exporting and sorting records/i }));

        expect(screen.getByText(/spreadsheet apps could interpret as formulas/i)).toBeVisible();
        expect(
            screen.getByText((_content, element) => {
                const text = element?.textContent?.replace(/\s+/g, ' ') ?? '';

                return element?.tagName.toLowerCase() === 'p' && /use sort by to order application lists/i.test(text);
            })
        ).toBeVisible();
        expect(screen.getByText(/active and archived list and board choices are saved independently/i)).toBeVisible();
        expect(
            screen.getByText((_content, element) => {
                const text = element?.textContent?.replace(/\s+/g, ' ') ?? '';

                return (
                    element?.tagName.toLowerCase() === 'p' &&
                    /application boards keep columns in this order:.*accepted.*offer.*declined.*interview.*applied.*ghosted.*rejected/i.test(
                        text
                    )
                );
            })
        ).toBeVisible();

        await userEvent.click(screen.getByRole('button', { name: /auto scroll and highlighting/i }));

        expect(screen.getByText(/auto scroll only applies when sort by is set to job status/i)).toBeVisible();
    });
});
