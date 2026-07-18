import { useCallback, useMemo, useState } from 'react';
import type { JobStatus } from '../../../application/models';

type StatusChartVisibility = {
    hiddenStatuses: ReadonlySet<JobStatus>;
    visibleStatuses: JobStatus[];
    toggleStatus: (status: JobStatus) => void;
};

const useStatusChartVisibility = (statuses: readonly JobStatus[]): StatusChartVisibility => {
    const [hiddenStatuses, setHiddenStatuses] = useState<ReadonlySet<JobStatus>>(() => new Set());

    const visibleStatuses = useMemo(
        () => statuses.filter((status) => !hiddenStatuses.has(status)),
        [hiddenStatuses, statuses]
    );

    const toggleStatus = useCallback((status: JobStatus) => {
        setHiddenStatuses((currentStatuses) => {
            const nextStatuses = new Set(currentStatuses);
            if (nextStatuses.has(status)) {
                nextStatuses.delete(status);
            } else {
                nextStatuses.add(status);
            }
            return nextStatuses;
        });
    }, []);

    return { hiddenStatuses, visibleStatuses, toggleStatus };
};

export default useStatusChartVisibility;
