import type { IconName } from '../icon/models';

export type EmptyStateAction = {
    label: string;
    onClick?: () => void;
    to?: string;
};

export type EmptyStateProps = {
    description?: string;
    followsControls?: boolean;
    icon?: IconName;
    primaryAction?: EmptyStateAction;
    secondaryAction?: EmptyStateAction;
    title: string;
};
