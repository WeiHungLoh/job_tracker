import type { MouseEvent } from 'react';
import type { ArchivedJobInterview, JobInterview } from '../../interview/models';

type DemoInterviewCardBaseProps = {
    index: number;
    isDeleting: boolean;
    onDelete: () => void | Promise<void>;
    onViewApplicationClick: (event: MouseEvent<HTMLAnchorElement>) => void | Promise<void>;
};

export type DemoJobInterviewCardProps = DemoInterviewCardBaseProps & {
    interview: JobInterview;
    variant: 'job';
};

export type DemoArchivedInterviewCardProps = DemoInterviewCardBaseProps & {
    interview: ArchivedJobInterview;
    variant: 'archived';
};

export type DemoInterviewCardProps = DemoJobInterviewCardProps | DemoArchivedInterviewCardProps;
