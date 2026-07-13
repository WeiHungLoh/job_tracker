import { useEffect, useState } from 'react';

const CURRENT_TIME_REFRESH_INTERVAL_MS = 30 * 1000;

const useCurrentTime = (): Date => {
    const [currentTime, setCurrentTime] = useState(() => new Date());

    useEffect(() => {
        const intervalId = window.setInterval(() => setCurrentTime(new Date()), CURRENT_TIME_REFRESH_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, []);

    return currentTime;
};

export default useCurrentTime;
