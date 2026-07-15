import type { HTMLAttributes } from 'react';

export type LoadingSpinnerProps = HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | number;
    title?: string;
    variant?: 'light' | 'primary';
};
