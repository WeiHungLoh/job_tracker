import Icon from '../icon/Icon';
import PrimaryButton from '../button/PrimaryButton';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import type { ControlDropdownProps } from './models';
import styles from './ControlDropdown.module.css';
import useControlDropdown from './useControlDropdown';

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
    triggerAriaLabel,
    triggerClassName = '',
    triggerStyle,
    triggerVariant = 'navigation',
}: ControlDropdownProps) => {
    const {
        closeDropdown,
        containerRef,
        dropdownMaxHeight,
        dropdownOffset,
        dropdownRef,
        isOpen,
        openAbove,
        toggleDropdown,
        triggerRef,
    } = useControlDropdown();
    const hasActivityStyle = triggerStyle === 'activity';
    const dropdownId = `${id}-options`;
    const containerClasses = [
        styles.container,
        hasActivityStyle ? styles.activityContainer : '',
        isOpen ? styles.open : '',
        openAbove ? styles.openAbove : '',
        containerClassName,
    ]
        .filter(Boolean)
        .join(' ');
    const triggerClasses = [hasActivityStyle ? styles.activityTrigger : '', triggerClassName].filter(Boolean).join(' ');
    const dropdownClasses = [styles.dropdown, hasActivityStyle ? styles.activityDropdown : '', dropdownClassName]
        .filter(Boolean)
        .join(' ');
    const dropdownStyle = {
        '--dropdown-max-height': dropdownMaxHeight === null ? undefined : `${dropdownMaxHeight}px`,
        '--dropdown-offset': `${dropdownOffset}px`,
    } as CSSProperties;
    const handleSelect = (event: ReactMouseEvent<HTMLDivElement>) => {
        const target = event.target;
        if (target instanceof Element && target.closest('label') && target.tagName !== 'INPUT') {
            return;
        }

        closeDropdown();
        triggerRef.current?.focus();
    };

    return (
        <div className={containerClasses} ref={containerRef}>
            <PrimaryButton
                aria-controls={dropdownId}
                aria-expanded={isOpen}
                aria-haspopup={dropdownRole === 'menu' ? 'menu' : undefined}
                aria-label={triggerAriaLabel}
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
                    data-placement={openAbove ? 'top' : 'bottom'}
                    id={dropdownId}
                    onClick={closeOnSelect ? handleSelect : undefined}
                    ref={dropdownRef}
                    role={dropdownRole}
                    style={dropdownStyle}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export default ControlDropdown;
