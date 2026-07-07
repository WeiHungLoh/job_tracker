import type { JobStatus } from '../models';
import type { ReactNode } from 'react';

export type BoardColumnApplication = {
    job_status: JobStatus;
};

export type BoardColumnContentProps = {
    applications: readonly BoardColumnApplication[];
    children: ReactNode;
    status: JobStatus;
};

export type ApplicationBoardColumnProps = BoardColumnContentProps & {
    droppable?: boolean;
    isDropDisabled?: boolean;
};
