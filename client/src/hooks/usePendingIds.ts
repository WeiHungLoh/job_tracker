import { useCallback, useState } from 'react';

const usePendingIds = () => {
    const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(() => new Set());

    const startPending = useCallback((id: number) => {
        setPendingIds((currentIds) => new Set(currentIds).add(id));
    }, []);

    const stopPending = useCallback((id: number) => {
        setPendingIds((currentIds) => {
            const updatedIds = new Set(currentIds);
            updatedIds.delete(id);
            return updatedIds;
        });
    }, []);

    return { pendingIds, startPending, stopPending };
};

export default usePendingIds;
