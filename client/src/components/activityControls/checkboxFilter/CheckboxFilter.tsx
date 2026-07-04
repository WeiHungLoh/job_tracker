import type { CheckboxFilterProps } from './models';
import styles from './CheckboxFilter.module.css';
import { useEffect, useState } from 'react';
import ControlDropdown from '../ControlDropdown';

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
    options,
    selectedOptions: savedOptions,
    onSelectionChange,
}: CheckboxFilterProps<Option>) => {
    const [selectedOptions, setSelectedOptions] = useState<Option[]>([...savedOptions]);

    useEffect(() => {
        setSelectedOptions([...savedOptions]);
    }, [savedOptions]);

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
        <ControlDropdown
            containerClassName={styles.checkboxFilter}
            disabled={disabled}
            dropdownClassName={styles.dropdown}
            id={id}
            label={buttonLabel}
        >
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
        </ControlDropdown>
    );
};

export default CheckboxFilter;
