import { MemoryRouter, useLocation } from 'react-router-dom';
import { screen } from '@testing-library/react';
import AuthProductIntro, { AUTH_FOCUSED_MODE_STORAGE_KEY } from '../../components/authProductIntro/AuthProductIntro';
import { render } from '../renderWithToast';
import { routes } from '../../routes';
import userEvent from '@testing-library/user-event';

globalThis.fetch = vi.fn();

const LocationProbe = () => {
    const location = useLocation();
    return <div data-testid='current-path'>{location.pathname}</div>;
};

const renderIntro = (onSubmit = vi.fn()) => {
    render(
        <MemoryRouter initialEntries={['/']}>
            <AuthProductIntro>
                <form onSubmit={onSubmit}>
                    <label htmlFor='email'>Email</label>
                    <input id='email' />
                    <label htmlFor='password'>Password</label>
                    <input id='password' />
                    <button type='submit'>Sign in</button>
                </form>
            </AuthProductIntro>
            <LocationProbe />
        </MemoryRouter>
    );

    return { onSubmit };
};

describe('AuthProductIntro demo action', () => {
    beforeEach(() => {
        fetch.mockReset();
        localStorage.removeItem(AUTH_FOCUSED_MODE_STORAGE_KEY);
    });

    afterEach(() => {
        localStorage.removeItem(AUTH_FOCUSED_MODE_STORAGE_KEY);
    });

    test('renders one Explore Demo anchor that opens the demo in a new tab', async () => {
        const { onSubmit } = renderIntro();

        const demoLinks = screen.getAllByRole('link', { name: /explore demo/i });
        expect(demoLinks).toHaveLength(1);
        expect(demoLinks[0]).toHaveAttribute('href', routes.demoViewApplications);
        expect(demoLinks[0]).toHaveAttribute('target', '_blank');
        expect(demoLinks[0]).toHaveAttribute('rel', 'noreferrer');
        expect(screen.getByText(/no account required/i)).toBeInTheDocument();

        await userEvent.click(demoLinks[0]);

        expect(screen.getByTestId('current-path')).toHaveTextContent(routes.signIn);
        expect(onSubmit).not.toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalled();
        expect(localStorage.getItem(AUTH_FOCUSED_MODE_STORAGE_KEY)).toBeNull();
    });

    test('keeps the user guide link in a new tab', () => {
        renderIntro();

        const guideLink = screen.getByRole('link', { name: /see how it works/i });
        expect(guideLink).toHaveAttribute('href', routes.userGuide);
        expect(guideLink).toHaveAttribute('target', '_blank');
        expect(guideLink).toHaveAttribute('rel', 'noreferrer');
    });

    test('hides Explore Demo in focused authentication mode and restores it with the overview', async () => {
        renderIntro();

        expect(screen.getByRole('link', { name: /explore demo/i })).toBeInTheDocument();

        await userEvent.click(screen.getByLabelText('Email', { exact: true }));

        expect(screen.queryByRole('link', { name: /explore demo/i })).not.toBeInTheDocument();
        expect(screen.getByLabelText('Organise your job search in one place', { selector: 'section' })).toHaveAttribute(
            'inert'
        );
        expect(localStorage.getItem(AUTH_FOCUSED_MODE_STORAGE_KEY)).toBe('true');

        await userEvent.click(screen.getByRole('button', { name: /why use job tracker/i }));

        expect(screen.getByRole('link', { name: /explore demo/i })).toBeInTheDocument();
        expect(localStorage.getItem(AUTH_FOCUSED_MODE_STORAGE_KEY)).toBeNull();
    });
});
