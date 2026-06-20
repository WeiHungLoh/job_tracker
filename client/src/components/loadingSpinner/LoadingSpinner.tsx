import type { LoadingSpinnerProps } from './models'
import styles from './LoadingSpinner.module.css'

const LoadingSpinner = ({ className = '', size, title = 'Loading', style, ...props }: LoadingSpinnerProps) => {
    const resolvedSize = size === 'sm' ? 20 : size ?? 40
    const classes = [styles.loadingSpinner, className].filter(Boolean).join(' ')
    return <div
        aria-label={title}
        className={classes}
        role='progressbar'
        style={{ width: resolvedSize, height: resolvedSize, ...style }}
        {...props}
    />
}

export default LoadingSpinner
