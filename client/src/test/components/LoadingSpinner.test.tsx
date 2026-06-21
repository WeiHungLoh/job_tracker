import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import styles from '../../components/loadingSpinner/LoadingSpinner.module.css';

describe('LoadingSpinner', () => {
    test('uses the primary variant by default', () => {
        render(<LoadingSpinner />);

        expect(screen.getByRole('progressbar')).toHaveClass(styles.primary);
    });

    test('supports the light variant for colored backgrounds', () => {
        render(<LoadingSpinner variant='light' />);

        expect(screen.getByRole('progressbar')).toHaveClass(styles.light);
    });
});
