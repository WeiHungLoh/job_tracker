import type { ButtonHTMLAttributes } from 'react';

export type PrimaryButtonVariant = 'compact' | 'default' | 'destructive' | 'form' | 'icon' | 'navigation' | 'secondary';

export type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    isLoading?: boolean;
    variant?: PrimaryButtonVariant;
};
