import type { ComponentProps, ReactNode } from 'react';
import type { CSVLink } from 'react-csv';

export type ActivityControlsProps = {
    children: ReactNode;
};

export type ControlDropdownProps = {
    children: ReactNode;
    id: string;
    label: string;
};

export type DisplayOptionsProps = {
    children: ReactNode;
    id: string;
};

export type MoreOptionsProps = {
    csvData: ComponentProps<typeof CSVLink>['data'];
    csvFilename: string;
    csvHeaders: ComponentProps<typeof CSVLink>['headers'];
    deleteLabel: string;
    id: string;
    isDeleting: boolean;
    onDelete: () => void;
};
