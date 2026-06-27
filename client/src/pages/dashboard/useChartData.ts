import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../components/toast/ToastProvider';
import { getErrorMessage } from '../../helper/getErrorMessage';

export const useChartData = <T>(fetcher: () => Promise<T[]>) => {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showErrorToast } = useToast();
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    useEffect(() => {
        let isActive = true;

        const load = async () => {
            try {
                const result = await fetcherRef.current();
                if (isActive) {
                    setData(Array.isArray(result) ? result : []);
                }
            } catch (error) {
                showErrorToast(getErrorMessage(error));
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        void load();

        return () => {
            isActive = false;
        };
    }, []);

    return { data, isLoading };
};
