import type { EmptyStateProps } from '../../components/emptyState/models';

type ActiveInterviewEmptyStateOptions = {
    applicationsRoute: string;
    filtersAreActive?: boolean;
    onClearFilters?: () => void;
    variant: 'active';
};

type ArchivedInterviewEmptyStateOptions = {
    activeInterviewsRoute: string;
    filtersAreActive?: boolean;
    onClearFilters?: () => void;
    variant: 'archived';
};

type InterviewEmptyStateOptions = ActiveInterviewEmptyStateOptions | ArchivedInterviewEmptyStateOptions;

export const createInterviewEmptyState = (options: InterviewEmptyStateOptions): EmptyStateProps => {
    if (options.filtersAreActive) {
        return {
            title: 'No interviews match your filters',
            description: 'Try showing all interviews or choose a different time filter.',
            followsControls: true,
            icon: 'interview',
            primaryAction: { label: 'Show all interviews', onClick: options.onClearFilters },
        };
    }

    if (options.variant === 'archived') {
        return {
            title: 'No archived interviews yet',
            description: 'Interviews linked to archived applications will appear here.',
            followsControls: true,
            icon: 'archive',
            secondaryAction: { label: 'View active interviews', to: options.activeInterviewsRoute },
        };
    }

    return {
        title: 'No interviews yet',
        description: 'Add interviews after creating a job application to keep your schedule organised.',
        followsControls: true,
        icon: 'interview',
        primaryAction: { label: 'View applications', to: options.applicationsRoute },
    };
};
