export type CheckboxFilterProps<Option extends string> = {
    buttonLabel: string;
    disabled?: boolean;
    id: string;
    label: string;
    options: readonly Option[];
    selectedOptions: readonly Option[];
    onSelectionChange: (selectedOptions: Option[]) => Promise<boolean>;
};
