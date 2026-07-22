import type { EmptyStateProps } from '../../components/emptyState/models';
import type { OfferDecisionFilter } from './models';

type OfferDecisionEmptyStateOptions = {
    applicationsRoute: string;
    hasApplications: boolean;
    onClearFilters: () => void;
    readOnly: boolean;
    selectedFilters: readonly OfferDecisionFilter[];
};

export const createOfferDecisionEmptyState = ({
    applicationsRoute,
    hasApplications,
    onClearFilters,
    readOnly,
    selectedFilters,
}: OfferDecisionEmptyStateOptions): EmptyStateProps => {
    if (!hasApplications) {
        return {
            description: readOnly
                ? 'Saved evaluations appear here after their applications are archived.'
                : 'Applications with Offer status appear here, along with saved evaluations that later move to Accepted or Declined.',
            followsControls: true,
            icon: readOnly ? 'archive' : 'briefcase',
            title: readOnly ? 'No archived offer comparisons' : 'No offers to compare',
        };
    }

    if (!readOnly && selectedFilters.length === 1 && selectedFilters[0] === 'Offers to Evaluate') {
        return {
            description: 'Applications must have Offer status and no saved evaluation to appear here.',
            followsControls: true,
            icon: 'briefcase',
            primaryAction: { label: 'View applications', to: applicationsRoute },
            title: 'No offers to evaluate',
        };
    }

    return {
        description: readOnly
            ? 'Try showing all evaluation types to see every archived offer comparison.'
            : 'Try showing all evaluation types to see every offer comparison.',
        followsControls: true,
        icon: readOnly ? 'archive' : 'briefcase',
        primaryAction: { label: 'Clear filters', onClick: onClearFilters },
        title: readOnly
            ? 'No archived offer comparisons match your filters'
            : 'No offer comparisons match your filters',
    };
};
