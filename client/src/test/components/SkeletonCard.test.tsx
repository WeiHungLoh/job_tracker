import { render, screen } from '@testing-library/react';
import SkeletonCard from '../../components/skeletonLoader/skeletonCard/SkeletonCard';

describe('SkeletonCard', () => {
    test('renders an application skeleton with two actions', () => {
        render(<SkeletonCard variant='application' />);

        expect(screen.getByRole('status', { name: 'Loading results' })).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByTestId('skeleton-text-lines')).toHaveProperty('childElementCount', 5);
        expect(screen.getByTestId('skeleton-actions')).toHaveProperty('childElementCount', 2);
    });

    test('renders an interview skeleton with one action', () => {
        render(<SkeletonCard variant='interview' />);

        expect(screen.getByTestId('skeleton-text-lines')).toHaveProperty('childElementCount', 5);
        expect(screen.getByTestId('skeleton-actions')).toHaveProperty('childElementCount', 1);
    });

    test('keeps List layout and loading announcements as backwards-compatible defaults', () => {
        render(<SkeletonCard variant='interview' />);

        expect(screen.getByRole('status', { name: 'Loading results' })).toBeInTheDocument();
        expect(screen.getByTestId('skeleton-card').className).not.toContain('board');
    });
});
