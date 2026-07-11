import type { PropsWithChildren, ReactNode } from 'react';
import styles from './BoardCardActions.module.css';

type BoardCardActionsProps = PropsWithChildren<{
    actions: ReactNode;
    compactActions?: boolean;
}>;

const BoardCardActions = ({ actions, children, compactActions = false }: BoardCardActionsProps) => (
    <details className={styles.actions}>
        <summary>Actions</summary>
        <div className={styles.actionPanel}>
            {children}
            <div className={`${styles.actionButtons} ${compactActions ? styles.compactActions : ''}`}>{actions}</div>
        </div>
    </details>
);

export default BoardCardActions;
