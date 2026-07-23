import { render, screen } from '@testing-library/react';
import SkeletonInterviewBoard from '../../components/skeletonLoader/skeletonInterviewBoard/SkeletonInterviewBoard';

describe('SkeletonInterviewBoard', () => {
    test('renders four Board placeholders under one accessible loading announcement', () => {
        render(<SkeletonInterviewBoard />);

        expect(screen.getByRole('status', { name: 'Loading interviews' })).toHaveAttribute('aria-busy', 'true');
        expect(screen.getAllByTestId('skeleton-card')).toHaveLength(4);
        expect(
            screen.getAllByTestId('skeleton-card').every((card) => card.getAttribute('aria-hidden') === 'true')
        ).toBe(true);
        expect(screen.getAllByRole('status')).toHaveLength(1);
    });
});
