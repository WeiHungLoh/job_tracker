import type { ButtonHTMLAttributes } from 'react';

export type PrimaryButtonVariant =
    | 'compact'
    | 'default'
    | 'destructive'
    | 'form'
    | 'icon'
    | 'navigation'
    | 'secondary'
    | 'success';

export type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: PrimaryButtonVariant;
};
