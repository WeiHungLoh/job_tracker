import type { HTMLAttributes } from 'react'

export type LoadingSpinnerProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
    size?: 'sm' | number
    title?: string
}
