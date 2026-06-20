import type { PrimaryButtonProps, PrimaryButtonVariant } from './models'
import styles from './PrimaryButton.module.css'

const getVariantClassName = (variant: PrimaryButtonVariant) => {
    switch (variant) {
        case 'compact':
            return `${styles.primary} ${styles.compact}`
        case 'form':
            return `${styles.primary} ${styles.form}`
        case 'icon':
            return styles.icon
        case 'navigation':
            return styles.navigation
        case 'success':
            return styles.success
        default:
            return styles.primary
    }
}

const PrimaryButton = ({ className = '', variant = 'default', ...props }: PrimaryButtonProps) => {
    const classes = [styles.button, getVariantClassName(variant), className]
        .filter(Boolean)
        .join(' ')

    return <button className={classes} {...props} />
}

export default PrimaryButton
