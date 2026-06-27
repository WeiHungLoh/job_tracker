import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Theme, ThemeContextValue } from './models';
import { createMuiTheme } from './muiTheme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'theme';

const getInitialTheme = (): Theme => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') {
            return stored;
        }
    } catch {
        // localStorage unavailable
    }

    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);
    const muiTheme = useMemo(() => createMuiTheme(theme), [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) => {
            const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
            try {
                localStorage.setItem(STORAGE_KEY, nextTheme);
            } catch {
                // localStorage unavailable
            }
            return nextTheme;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
