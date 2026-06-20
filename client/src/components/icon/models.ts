import type { HTMLAttributes } from 'react'

export type IconName =
    | 'activeApplications'
    | 'alert'
    | 'archive'
    | 'briefcase'
    | 'email'
    | 'lock'
    | 'visibility'
    | 'visibilityOff'

export type IconProps = HTMLAttributes<SVGElement> & {
    name: IconName
    size?: number | string
    title?: string
}
