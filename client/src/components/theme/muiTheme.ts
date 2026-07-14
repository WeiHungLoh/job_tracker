import { createTheme } from '@mui/material/styles';
import type { Theme } from './models';

export const createMuiTheme = (theme: Theme) => {
    return createTheme({
        palette: {
            mode: theme,
            primary: {
                main: theme === 'dark' ? '#ff779b' : '#a81f4c',
            },
        },
        typography: {
            fontFamily: 'var(--fontFamilyBase)',
        },
        components: {
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: '16px',
                        backgroundColor: 'var(--colorCardBg)',
                        backgroundImage: 'none',
                    },
                },
            },
            MuiDialogTitle: {
                styleOverrides: {
                    root: theme === 'dark' ? { color: '#fff', fontWeight: 700, opacity: 1 } : {},
                },
            },
            MuiDialogContentText: {
                styleOverrides: {
                    root: theme === 'dark' ? { color: '#fff', opacity: 0.6 } : {},
                },
            },
            MuiDialogActions: {
                styleOverrides: {
                    root: {
                        backgroundColor: 'var(--colorCardBg)',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        padding: 'var(--spaceControl) var(--spaceCompact)',
                        borderRadius: 'var(--radiusControl)',
                        boxShadow: 'none',
                        textTransform: 'none',
                    },
                    containedPrimary: {
                        backgroundColor: 'var(--colorPrimary)',
                        color: 'var(--colorBtnPrimaryText)',
                        '&:hover': {
                            backgroundColor: 'var(--colorPrimaryHover)',
                            boxShadow: 'none',
                        },
                    },
                    outlinedPrimary: {
                        border: '1.5px solid var(--colorPrimary)',
                        color: 'var(--colorPrimary)',
                        '&:hover': {
                            border: '1.5px solid var(--colorPrimary)',
                            backgroundColor: 'var(--colorBtnSecondaryHoverBg)',
                        },
                    },
                },
            },
        },
    });
};
