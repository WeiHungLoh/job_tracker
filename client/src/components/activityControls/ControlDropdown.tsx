import Icon from '../icon/Icon';
import PrimaryButton from '../button/PrimaryButton';
import type { ControlDropdownProps } from './models';
import styles from './ControlDropdown.module.css';
import useDropdown from '../../hooks/useDropdown';

const ControlDropdown = ({ children, id, label }: ControlDropdownProps) => {
    const { alignRight, containerRef, dropdownRef, isOpen, toggleDropdown } = useDropdown();

    return (
        <div className={styles.container} ref={containerRef}>
            <PrimaryButton
                aria-controls={`${id}-options`}
                aria-expanded={isOpen}
                className={styles.toggle}
                onClick={toggleDropdown}
                type='button'
                variant='navigation'
            >
                <span>{label}</span>
                <Icon
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    name='chevronDown'
                    size={18}
                />
            </PrimaryButton>

            {isOpen && (
                <div
                    className={`${styles.dropdown} ${alignRight ? styles.alignRight : ''}`}
                    id={`${id}-options`}
                    ref={dropdownRef}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export default ControlDropdown;
