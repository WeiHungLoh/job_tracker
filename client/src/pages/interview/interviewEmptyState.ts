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
            description:
                options.variant === 'archived'
                    ? 'Try showing all time filters to see every archived interview.'
                    : 'Try showing all time filters to see every active interview.',
            followsControls: true,
            icon: 'interview',
            primaryAction: { label: 'Clear filters', onClick: options.onClearFilters },
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
