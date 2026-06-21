import type { HTMLAttributes } from 'react';

export type IconName =
    | 'activeApplications'
    | 'alert'
    | 'archive'
    | 'briefcase'
    | 'chevronDown'
    | 'dashboard'
    | 'delete'
    | 'email'
    | 'export'
    | 'guide'
    | 'highlight'
    | 'interview'
    | 'lock'
    | 'notes'
    | 'sort'
    | 'visibility'
    | 'visibilityOff';

export type IconProps = HTMLAttributes<SVGElement> & {
    name: IconName;
    size?: number | string;
    title?: string;
};
