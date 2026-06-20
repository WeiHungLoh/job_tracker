import type { ButtonHTMLAttributes } from 'react'

export type PrimaryButtonVariant = 'compact' | 'default' | 'form' | 'icon' | 'navigation' | 'success'

export type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: PrimaryButtonVariant
}
