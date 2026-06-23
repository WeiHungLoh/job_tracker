import type { PropsWithChildren } from 'react';
import type { UserPreferences, UserPreferencesContextValue } from './models';
import { createContext, useContext, useMemo } from 'react';

const UserPreferencesContext = createContext<UserPreferencesContextValue | undefined>(undefined);

export const UserPreferencesProvider = ({
    children,
    preferences,
    updatePreferences,
}: PropsWithChildren<UserPreferencesContextValue>) => {
    const contextValue = useMemo(() => ({ preferences, updatePreferences }), [preferences, updatePreferences]);

    return <UserPreferencesContext.Provider value={contextValue}>{children}</UserPreferencesContext.Provider>;
};

export const useUserPreferences = () => {
    const context = useContext(UserPreferencesContext);

    if (!context) {
        throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
    }

    return context;
};

export type { UserPreferences };
