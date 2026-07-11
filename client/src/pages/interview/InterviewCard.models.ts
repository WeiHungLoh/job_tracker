import type { MouseEvent } from 'react';
import type { ArchivedJobInterview, JobInterview } from './models';
import type { ApplicationViewMode } from '../../components/activityControls/applicationViewToggle/models';

type InterviewCardBaseProps = {
    applicationRoute: string;
    index: number;
    isDeleting: boolean;
    layout?: ApplicationViewMode;
    onDelete: () => void | Promise<void>;
    onViewApplicationClick: (event: MouseEvent<HTMLAnchorElement>) => void | Promise<void>;
};

export type JobInterviewCardProps = InterviewCardBaseProps & {
    interview: JobInterview;
    variant: 'job';
};

export type ArchivedInterviewCardProps = InterviewCardBaseProps & {
    interview: ArchivedJobInterview;
    variant: 'archived';
};

export type InterviewCardProps = JobInterviewCardProps | ArchivedInterviewCardProps;
