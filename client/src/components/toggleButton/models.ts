export type ToggleButtonColor = 'green' | 'yellow' | 'blue';

export type ToggleButtonProps = {
    toggled: boolean;
    onToggle: () => void;
    label: string;
    toggledLabel: string;
    color?: ToggleButtonColor;
    'data-testid'?: string;
};
