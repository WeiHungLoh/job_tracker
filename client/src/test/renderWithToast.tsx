import type { ReactNode } from 'react';
import type { RenderOptions } from '@testing-library/react';
import { ToastProvider } from '../components/toast/ToastProvider';
import { UserPreferencesProvider } from '../components/userPreferences/UserPreferencesProvider';
import type { UpdateUserPreferencesRequest, UserPreferences } from '../components/userPreferences/models';
import { render as renderWithTestingLibrary } from '@testing-library/react';
import { useState } from 'react';

const testPreferences: UserPreferences = {
    user_id: 1,
    application_job_status: 'Show All',
    application_show_notes: false,
    application_show_archive: false,
    application_enable_scroll: false,
    archived_application_job_status: 'Show All',
    archived_application_show_notes: false,
};

const TestProviders = ({ children }: { children: ReactNode }) => {
    const [preferences, setPreferences] = useState(testPreferences);

    const updatePreferences = async (updatedPreferences: UpdateUserPreferencesRequest) => {
        let savedPreferences = testPreferences;
        setPreferences((currentPreferences) => {
            savedPreferences = { ...currentPreferences, ...updatedPreferences };
            return savedPreferences;
        });
        return savedPreferences;
    };

    return (
        <ToastProvider>
            <UserPreferencesProvider preferences={preferences} updatePreferences={updatePreferences}>
                {children}
            </UserPreferencesProvider>
        </ToastProvider>
    );
};

export const render = (ui: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) => {
    return renderWithTestingLibrary(ui, { wrapper: TestProviders, ...options });
};
