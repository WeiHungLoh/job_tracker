import type { CheckboxFilterProps } from './models';
import Icon from '../icon/Icon';
import PrimaryButton from '../button/PrimaryButton';
import styles from './CheckboxFilter.module.css';
import { useEffect, useRef, useState } from 'react';

const haveSameOptions = <Option extends string>(
    firstOptions: readonly Option[],
    secondOptions: readonly Option[]
): boolean => {
    return (
        firstOptions.length === secondOptions.length && firstOptions.every((option) => secondOptions.includes(option))
    );
};

const CheckboxFilter = <Option extends string>({
    buttonLabel,
    disabled = false,
    id,
    label,
    options,
    selectedOptions: savedOptions,
    onSelectionChange,
}: CheckboxFilterProps<Option>) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedOptions, setSelectedOptions] = useState<Option[]>([...savedOptions]);

    useEffect(() => {
        setSelectedOptions([...savedOptions]);
    }, [savedOptions]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [isOpen]);

    const allSelected = options.length > 0 && options.every((option) => selectedOptions.includes(option));

    const applySelection = async (nextOptions: Option[]) => {
        setSelectedOptions(nextOptions);

        if (haveSameOptions(nextOptions, savedOptions)) {
            return;
        }

        try {
            const selectionSaved = await onSelectionChange(nextOptions);
            if (!selectionSaved) {
                setSelectedOptions([...savedOptions]);
            }
        } catch {
            setSelectedOptions([...savedOptions]);
        }
    };

    const handleShowAllToggle = () => {
        if (allSelected) {
            setSelectedOptions([]);
            return;
        }

        void applySelection([...options]);
    };

    const handleOptionToggle = (option: Option) => {
        const nextOptions = selectedOptions.includes(option)
            ? selectedOptions.filter((selectedOption) => selectedOption !== option)
            : [...selectedOptions, option];

        void applySelection(nextOptions.length === 0 ? [...options] : nextOptions);
    };

    return (
        <div className={styles.checkboxFilter} ref={containerRef}>
            <div>{label}</div>
            <PrimaryButton
                aria-controls={`${id}-options`}
                aria-expanded={isOpen}
                className={styles.toggle}
                disabled={disabled}
                onClick={() => setIsOpen((current) => !current)}
                type='button'
                variant='navigation'
            >
                <span className={styles.toggleText}>{buttonLabel}</span>
                <Icon
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    name='chevronDown'
                    size={18}
                />
            </PrimaryButton>

            {isOpen && (
                <div className={styles.dropdown} id={`${id}-options`}>
                    <label className={styles.option}>
                        <input checked={allSelected} onChange={handleShowAllToggle} type='checkbox' />
                        <span aria-hidden='true' className={styles.checkbox} />
                        <span>Show All</span>
                    </label>

                    {options.map((option) => (
                        <label className={styles.option} key={option}>
                            <input
                                checked={selectedOptions.includes(option)}
                                onChange={() => handleOptionToggle(option)}
                                type='checkbox'
                            />
                            <span aria-hidden='true' className={styles.checkbox} />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CheckboxFilter;
