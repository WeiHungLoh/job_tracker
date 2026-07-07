export type ApplicationViewMode = 'list' | 'board';

export type ApplicationViewToggleProps = {
    currentView: ApplicationViewMode;
    onViewChange: (viewMode: ApplicationViewMode) => void;
};
