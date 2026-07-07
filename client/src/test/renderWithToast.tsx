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
    application_view_mode: 'list',
    archived_application_job_statuses: [...JOB_STATUSES],
    archived_application_show_notes: false,
    archived_application_view_mode: 'list',
};

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
    initialPreferences?: Partial<UserPreferences>;
};

const createTestProviders = (initialPreferences?: Partial<UserPreferences>) => {
    const initialTestPreferences = { ...testPreferences, ...initialPreferences };

    const TestProviders = ({ children }: { children: ReactNode }) => {
        const [preferences, setPreferences] = useState<UserPreferences>(initialTestPreferences);

        const updatePreferences = async (updatedPreferences: UpdateUserPreferencesRequest) => {
            let savedPreferences = initialTestPreferences;
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

    return TestProviders;
};

export const render = (ui: ReactNode, options?: CustomRenderOptions) => {
    const { initialPreferences, ...renderOptions } = options ?? {};

    return renderWithTestingLibrary(ui, { wrapper: createTestProviders(initialPreferences), ...renderOptions });
};
