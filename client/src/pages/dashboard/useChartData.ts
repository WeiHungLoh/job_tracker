import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../components/toast/ToastProvider';

export function useChartData<T>(fetcher: () => Promise<T[]>) {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showErrorToast } = useToast();
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    useEffect(() => {
        let isActive = true;

        async function load() {
            try {
                const result = await fetcherRef.current();
                if (isActive) {
                    setData(Array.isArray(result) ? result : []);
                }
            } catch (error) {
                showErrorToast((error as Error).message);
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        }

        load();

        return () => {
            isActive = false;
        };
    }, []);

    return { data, isLoading };
}
