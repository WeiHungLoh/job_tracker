import LoadingSpinner from '../loadingSpinner/LoadingSpinner';
import type { PrimaryButtonProps, PrimaryButtonVariant } from './models';
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
    ref,
    variant = 'default',
    ...props
}: PrimaryButtonProps) => {
    const classes = [styles.button, VARIANT_CLASS[variant], isLoading ? styles.loading : '', className]
        .filter(Boolean)
        .join(' ');

    const spinnerVariant = variant === 'secondary' ? 'primary' : 'light';

    return (
        <button
            aria-busy={isLoading || undefined}
            className={classes}
            disabled={disabled || isLoading}
            ref={ref}
            {...props}
        >
            {isLoading ? (
                <>
                    <span className={styles.hiddenContent}>{children}</span>

                    <span className={styles.spinner}>
                        <LoadingSpinner size='sm' variant={spinnerVariant} />
                    </span>
                </>
            ) : (
                children
            )}
        </button>
    );
};

export default PrimaryButton;
