import type { EmptyStateProps } from '../../components/emptyState/models';

type ApplicationEmptyStateOptions = {
    actionRoute: string;
    filtersAreActive: boolean;
    onClearFilters: () => void;
    variant: 'active' | 'archived';
};

export const createApplicationEmptyState = ({
    actionRoute,
    filtersAreActive,
    onClearFilters,
    variant,
}: ApplicationEmptyStateOptions): EmptyStateProps => {
    const isArchived = variant === 'archived';

    if (filtersAreActive) {
        return {
            title: isArchived ? 'No archived applications match your filters' : 'No applications match your filters',
            description: isArchived
                ? 'Try showing all statuses to see every archived application.'
                : 'Try showing all statuses to see every active application.',
            followsControls: true,
            icon: isArchived ? 'archive' : 'briefcase',
            primaryAction: { label: 'Clear filters', onClick: onClearFilters },
        };
    }

    if (isArchived) {
        return {
            title: 'No archived applications yet',
            description: 'Archive applications you no longer need in your active pipeline. They will appear here.',
            followsControls: true,
            icon: 'archive',
            secondaryAction: { label: 'View active applications', to: actionRoute },
        };
    }

    return {
        title: 'No active applications yet',
        description: 'Add your first job application to start tracking your search.',
        followsControls: true,
        icon: 'briefcase',
        primaryAction: { label: 'Add application', to: actionRoute },
    };
};
