import { render, screen, within } from '@testing-library/react';
import PrimaryButton from '../../components/button/PrimaryButton';
import styles from '../../components/button/PrimaryButton.module.css';

describe('PrimaryButton', () => {
    test('keeps its label in layout while showing the small loading spinner', () => {
        render(
            <PrimaryButton isLoading variant='destructive'>
                Delete all applications
            </PrimaryButton>
        );

        const button = screen.getByRole('button');
        const spinner = within(button).getByRole('progressbar', { name: 'Loading' });

        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
        expect(button).toHaveClass(styles.loading);
        expect(screen.getByText('Delete all applications')).toHaveClass(styles.content);
        expect(spinner).toHaveStyle({ width: '20px', height: '20px' });
    });
});
