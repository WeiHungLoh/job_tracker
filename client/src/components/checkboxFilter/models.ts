export type CheckboxFilterProps<Option extends string> = {
    buttonLabel: string;
    id: string;
    label: string;
    options: readonly Option[];
    selectedOptions: readonly Option[];
    onSelectionChange: (selectedOptions: Option[]) => Promise<void>;
};
