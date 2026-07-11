import type { EmptyStateProps } from '../../components/emptyState/EmptyState';

type ActiveInterviewEmptyStateOptions = {
    applicationsRoute: string;
    variant: 'active';
};

type ArchivedInterviewEmptyStateOptions = {
    activeInterviewsRoute: string;
    variant: 'archived';
};

type InterviewEmptyStateOptions = ActiveInterviewEmptyStateOptions | ArchivedInterviewEmptyStateOptions;

export const createInterviewEmptyState = (options: InterviewEmptyStateOptions): EmptyStateProps => {
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
