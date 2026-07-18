import type { PropsWithChildren, ReactNode } from 'react';
import styles from './BoardCardActions.module.css';

type BoardCardActionsProps = PropsWithChildren<{
    actions: ReactNode;
    compactActions?: boolean;
    compactPanelSpacing?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
}>;

const BoardCardActions = ({
    actions,
    children,
    compactActions = false,
    compactPanelSpacing = false,
    onOpenChange,
}: BoardCardActionsProps) => (
    <details
        className={`${styles.actions} ${compactPanelSpacing ? styles.compactPanelSpacing : ''}`}
        onToggle={(event) => onOpenChange?.(event.currentTarget.open)}
    >
        <summary>Actions</summary>
        <div className={styles.actionPanel}>
            {children}
            <div className={`${styles.actionButtons} ${compactActions ? styles.compactActions : ''}`}>{actions}</div>
        </div>
    </details>
);

export default BoardCardActions;
