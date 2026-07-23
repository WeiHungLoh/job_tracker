import type { EmptyStateProps } from '../../components/emptyState/models';
type OfferDecisionEmptyStateOptions = {
    filtersAreActive: boolean;
    onClearFilters: () => void;
    readOnly: boolean;
};

export const createOfferDecisionEmptyState = ({
    filtersAreActive,
    onClearFilters,
    readOnly,
}: OfferDecisionEmptyStateOptions): EmptyStateProps => {
    if (!filtersAreActive) {
        return {
            description: readOnly
                ? 'Saved evaluations appear here after their applications are archived.'
                : 'Applications with Offer status appear here, along with saved evaluations that later move to Accepted or Declined.',
            followsControls: true,
            icon: readOnly ? 'archive' : 'briefcase',
            title: readOnly ? 'No archived offer comparisons' : 'No offers to compare',
        };
    }

    return {
        description: readOnly
            ? 'Try showing all evaluation types to see every archived offer comparison.'
            : 'Try showing all evaluation types to see every active offer comparison.',
        followsControls: true,
        icon: readOnly ? 'archive' : 'briefcase',
        primaryAction: { label: 'Clear filters', onClick: onClearFilters },
        title: readOnly
            ? 'No archived offer comparisons match your filters'
            : 'No offer comparisons match your filters',
    };
};
