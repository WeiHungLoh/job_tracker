import { createContext, useContext, useLayoutEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { routes } from '../../../routes';
import { getQuickCaptureCleanPath, getQuickCaptureData, type QuickCaptureData } from './quickCapture';

const EMPTY_QUICK_CAPTURE_DATA: QuickCaptureData = {
    hasCaptureParameters: false,
    jobURL: '',
    pageTitle: '',
    companyName: '',
    jobTitle: '',
    jobLocation: '',
};

const QuickCaptureContext = createContext<QuickCaptureData>(EMPTY_QUICK_CAPTURE_DATA);

export const useQuickCaptureData = (): QuickCaptureData => {
    return useContext(QuickCaptureContext);
};

const QuickCaptureProvider = () => {
    const location = useLocation();
    const capturedData = useMemo(
        () =>
            location.pathname === routes.addApplication
                ? getQuickCaptureData(location.search, location.hash)
                : EMPTY_QUICK_CAPTURE_DATA,
        [location.hash, location.pathname, location.search]
    );

    useLayoutEffect(() => {
        if (!capturedData.hasCaptureParameters) {
            return;
        }

        window.history.replaceState(
            window.history.state,
            '',
            getQuickCaptureCleanPath(location.pathname, location.search, location.hash)
        );
    }, [capturedData.hasCaptureParameters, location.hash, location.pathname, location.search]);

    return (
        <QuickCaptureContext.Provider value={capturedData}>
            <Outlet />
        </QuickCaptureContext.Provider>
    );
};

export default QuickCaptureProvider;
