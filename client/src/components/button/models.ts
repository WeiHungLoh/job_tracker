import type { ComponentPropsWithRef } from 'react';

export type PrimaryButtonVariant = 'compact' | 'default' | 'destructive' | 'form' | 'icon' | 'navigation' | 'secondary';

export type PrimaryButtonProps = ComponentPropsWithRef<'button'> & {
    isLoading?: boolean;
    variant?: PrimaryButtonVariant;
};
