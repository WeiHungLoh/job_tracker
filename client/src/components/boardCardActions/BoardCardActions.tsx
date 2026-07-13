import type { PropsWithChildren, ReactNode } from 'react';
import styles from './BoardCardActions.module.css';

type BoardCardActionsProps = PropsWithChildren<{
    actions: ReactNode;
    compactActions?: boolean;
    compactPanelSpacing?: boolean;
}>;

const BoardCardActions = ({
    actions,
    children,
    compactActions = false,
    compactPanelSpacing = false,
}: BoardCardActionsProps) => (
    <details className={`${styles.actions} ${compactPanelSpacing ? styles.compactPanelSpacing : ''}`}>
        <summary>Actions</summary>
        <div className={styles.actionPanel}>
            {children}
            <div className={`${styles.actionButtons} ${compactActions ? styles.compactActions : ''}`}>{actions}</div>
        </div>
    </details>
);

export default BoardCardActions;
