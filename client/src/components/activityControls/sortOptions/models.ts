export type SortOption<SortOrder extends string> = {
    readonly label: string;
    readonly value: SortOrder;
};

export type SortOptionsProps<SortOrder extends string> = {
    disabled?: boolean;
    id: string;
    onSelectionChange: (selectedOption: SortOrder) => Promise<boolean>;
    options: readonly SortOption<SortOrder>[];
    selectedOption: SortOrder;
};
