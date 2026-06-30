import type { ReactNode } from 'react';
import type { RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../components/theme/ThemeContext';
import { ToastProvider } from '../components/toast/ToastProvider';
import { UserPreferencesProvider } from '../components/userPreferences/UserPreferencesProvider';
import type { UpdateUserPreferencesRequest, UserPreferences } from '../components/userPreferences/models';
import { render as renderWithTestingLibrary } from '@testing-library/react';
import { useState } from 'react';
import { JOB_STATUSES } from '../pages/application/models';

const testPreferences: UserPreferences = {
    application_job_statuses: [...JOB_STATUSES],
    application_show_notes: false,
    application_show_archive: false,
    application_enable_scroll: false,
    archived_application_job_statuses: [...JOB_STATUSES],
    archived_application_show_notes: false,
};

const TestProviders = ({ children }: { children: ReactNode }) => {
    const [preferences, setPreferences] = useState<UserPreferences>(testPreferences);

    const updatePreferences = async (updatedPreferences: UpdateUserPreferencesRequest) => {
        let savedPreferences = testPreferences;
        setPreferences((currentPreferences) => {
            savedPreferences = { ...currentPreferences, ...updatedPreferences };
            return savedPreferences;
        });
        return savedPreferences;
    };

    return (
        <ThemeProvider>
            <ToastProvider>
                <UserPreferencesProvider preferences={preferences} updatePreferences={updatePreferences}>
                    {children}
                </UserPreferencesProvider>
            </ToastProvider>
        </ThemeProvider>
    );
};

export const render = (ui: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) => {
    return renderWithTestingLibrary(ui, { wrapper: TestProviders, ...options });
};
