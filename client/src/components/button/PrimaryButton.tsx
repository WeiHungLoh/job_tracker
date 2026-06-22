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
    success: styles.success,
};

const PrimaryButton = ({ className = '', variant = 'default', ...props }: PrimaryButtonProps) => {
    const classes = [styles.button, VARIANT_CLASS[variant], className].filter(Boolean).join(' ');

    return <button className={classes} {...props} />;
};

export default PrimaryButton;
