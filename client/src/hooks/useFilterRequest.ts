import { useRef } from 'react';

type SavedFilterResult<Result> = {
    requestId: number;
    result: Result;
};

const useFilterRequest = <Result>() => {
    const latestRequestId = useRef(0);
    const failedRequestId = useRef<number | null>(null);
    const latestSavedResult = useRef<SavedFilterResult<Result> | null>(null);

    const startRequest = (): number => {
        latestRequestId.current += 1;
        failedRequestId.current = null;
        return latestRequestId.current;
    };

    const isLatestRequest = (requestId: number): boolean => {
        return requestId === latestRequestId.current;
    };

    const saveResult = (requestId: number, result: Result): Result | undefined => {
        if (!latestSavedResult.current || requestId > latestSavedResult.current.requestId) {
            latestSavedResult.current = { requestId, result };
        }

        // An older preference save can finish after the newest filter request fails.
        const latestRequestFailed = failedRequestId.current === latestRequestId.current;
        if (!isLatestRequest(requestId) && !latestRequestFailed) {
            return undefined;
        }

        return latestSavedResult.current.result;
    };

    const failRequest = (requestId: number): Result | undefined => {
        if (!isLatestRequest(requestId)) {
            return undefined;
        }

        failedRequestId.current = requestId;
        return latestSavedResult.current?.result;
    };

    return { failRequest, isLatestRequest, saveResult, startRequest };
};

export default useFilterRequest;
