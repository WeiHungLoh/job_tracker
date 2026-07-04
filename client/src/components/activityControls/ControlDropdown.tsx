import Icon from '../icon/Icon';
import PrimaryButton from '../button/PrimaryButton';
import type { ControlDropdownProps } from './models';
import styles from './ControlDropdown.module.css';
import useDropdown from '../../hooks/useDropdown';

const ControlDropdown = ({
    children,
    closeOnSelect = false,
    containerClassName = '',
    disabled = false,
    dropdownAriaLabel,
    dropdownClassName = '',
    dropdownRole,
    id,
    label,
    triggerClassName = '',
    triggerVariant = 'navigation',
}: ControlDropdownProps) => {
    const { alignRight, closeDropdown, containerRef, dropdownRef, isOpen, toggleDropdown, triggerRef } = useDropdown();
    const dropdownId = `${id}-options`;
    const containerClasses = `${styles.container} ${containerClassName}`.trim();
    const triggerClasses = `${triggerVariant === 'navigation' ? styles.toggle : ''} ${triggerClassName}`.trim();
    const dropdownClasses = [styles.dropdown, alignRight ? styles.alignRight : '', dropdownClassName]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={containerClasses} ref={containerRef}>
            <PrimaryButton
                aria-controls={dropdownId}
                aria-expanded={isOpen}
                aria-haspopup={dropdownRole === 'menu' ? 'menu' : undefined}
                className={triggerClasses}
                disabled={disabled}
                onClick={toggleDropdown}
                ref={triggerRef}
                type='button'
                variant={triggerVariant}
            >
                <span className={styles.label}>{label}</span>
                <Icon
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    name='chevronDown'
                    size={18}
                />
            </PrimaryButton>

            {isOpen && (
                <div
                    aria-label={dropdownAriaLabel}
                    className={dropdownClasses}
                    id={dropdownId}
                    onClick={closeOnSelect ? closeDropdown : undefined}
                    ref={dropdownRef}
                    role={dropdownRole}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export default ControlDropdown;
