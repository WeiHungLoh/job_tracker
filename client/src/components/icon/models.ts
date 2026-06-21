import type { HTMLAttributes } from 'react';

export type IconName =
    | 'activeApplications'
    | 'alert'
    | 'arrowBack'
    | 'archive'
    | 'briefcase'
    | 'chevronDown'
    | 'error'
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
    | 'success'
    | 'visibility'
    | 'visibilityOff';

export type IconProps = HTMLAttributes<SVGElement> & {
    name: IconName;
    size?: number | string;
    title?: string;
};
