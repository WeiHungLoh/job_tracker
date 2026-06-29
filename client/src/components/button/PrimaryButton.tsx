import type { PrimaryButtonProps, PrimaryButtonVariant } from './models';
import LoadingSpinner from '../loadingSpinner/LoadingSpinner';
import styles from './PrimaryButton.module.css';

const VARIANT_CLASS: Record<PrimaryButtonVariant, string> = {
    compact: `${styles.primary} ${styles.compact}`,
    default: styles.primary,
    destructive: styles.destructive,
    form: `${styles.primary} ${styles.form}`,
    icon: styles.icon,
    navigation: styles.navigation,
    secondary: styles.secondary,
};

const PrimaryButton = ({
    children,
    className = '',
    disabled,
    isLoading = false,
    variant = 'default',
    ...props
}: PrimaryButtonProps) => {
    const classes = [styles.button, VARIANT_CLASS[variant], isLoading ? styles.loading : '', className]
        .filter(Boolean)
        .join(' ');
    const spinnerVariant = variant === 'secondary' ? 'primary' : 'light';

    return (
        <button aria-busy={isLoading || undefined} className={classes} disabled={disabled || isLoading} {...props}>
            <span className={styles.content}>{children}</span>
            {isLoading && (
                <span className={styles.spinner}>
                    <LoadingSpinner size='sm' variant={spinnerVariant} />
                </span>
            )}
        </button>
    );
};

export default PrimaryButton;
