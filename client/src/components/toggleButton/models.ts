export type ToggleButtonColor = 'green' | 'yellow';

export type ToggleButtonProps = {
    toggled: boolean;
    onToggle: () => void;
    label: string;
    toggledLabel: string;
    color?: ToggleButtonColor;
    'data-testid'?: string;
};
