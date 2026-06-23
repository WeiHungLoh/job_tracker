import { ConfirmProvider } from 'material-ui-confirm';
import FallbackScreen from '../fallbackScreen/FallbackScreen';
import Navbar from '../navbar/Navbar';
import { Outlet } from 'react-router-dom';
import { UserPreferencesProvider } from '../userPreferences/UserPreferencesProvider';
import type { UpdateUserPreferencesRequest, UserPreferences } from '../userPreferences/models';
import { useCallback, useEffect, useState } from 'react';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useToast } from '../toast/ToastProvider';

const ProtectedLayout = () => {
    const api = useJobTrackerAPI();
    const { showErrorToast } = useToast();
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [preferencesError, setPreferencesError] = useState(false);

    const loadPreferences = useCallback(async () => {
        setPreferencesError(false);
        setPreferences(null);
        try {
            setPreferences(await api.userPreferences.get());
        } catch (error) {
            setPreferencesError(true);
            showErrorToast(error instanceof Error ? error.message : 'Unable to load user preferences.');
        }
    }, [api.userPreferences, showErrorToast]);

    const updatePreferences = useCallback(
        async (updatedPreferences: UpdateUserPreferencesRequest) => {
            const savedPreferences = await api.userPreferences.update(updatedPreferences);
            setPreferences(savedPreferences);
            return savedPreferences;
        },
        [api.userPreferences]
    );

    useEffect(() => {
        void loadPreferences();
    }, [loadPreferences]);

    if (preferencesError) {
        return <FallbackScreen variant='authenticationError' onAction={() => void loadPreferences()} />;
    }

    if (!preferences) {
        return <FallbackScreen variant='loading' />;
    }

    return (
        <UserPreferencesProvider preferences={preferences} updatePreferences={updatePreferences}>
            <Navbar />
            <ConfirmProvider>
                <Outlet />
            </ConfirmProvider>
        </UserPreferencesProvider>
    );
};

export default ProtectedLayout;
