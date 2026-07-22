export type CollectionViewMode = 'list' | 'board';

export type CollectionViewToggleProps = {
    ariaLabel: string;
    currentView: CollectionViewMode;
    onViewChange: (viewMode: CollectionViewMode) => void;
};
