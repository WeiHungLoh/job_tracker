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
    | 'success'
    | 'visibility'
    | 'visibilityOff'
    | 'wifiOff'
    | 'darkMode'
    | 'lightMode';

export type IconProps = HTMLAttributes<SVGElement> & {
    name: IconName;
    size?: number | string;
    title?: string;
};
