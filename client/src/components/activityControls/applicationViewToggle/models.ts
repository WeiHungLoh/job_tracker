export type ApplicationViewMode = 'list' | 'board';

export type ApplicationViewToggleProps = {
    ariaLabel?: string;
    currentView: ApplicationViewMode;
    onViewChange: (viewMode: ApplicationViewMode) => void;
};
