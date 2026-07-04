import type { AriaRole, ComponentProps, ReactNode } from 'react';
import type { CSVLink } from 'react-csv';
import type { PrimaryButtonVariant } from '../button/models';

export type ActivityControlsProps = {
    children: ReactNode;
};

export type ControlDropdownProps = {
    children: ReactNode;
    closeOnSelect?: boolean;
    containerClassName?: string;
    disabled?: boolean;
    dropdownAriaLabel?: string;
    dropdownClassName?: string;
    dropdownRole?: AriaRole;
    id: string;
    label: ReactNode;
    triggerClassName?: string;
    triggerVariant?: PrimaryButtonVariant;
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
