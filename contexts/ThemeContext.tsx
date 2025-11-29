import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'mystic' | 'corporate';
export type Mode = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    mode: Mode;
    setTheme: (theme: Theme) => void;
    setMode: (mode: Mode) => void;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('app_theme') as Theme) || 'mystic';
    });

    const [mode, setMode] = useState<Mode>(() => {
        return (localStorage.getItem('app_mode') as Mode) || 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove old classes/attributes
        root.classList.remove('light', 'dark');

        // Apply new state
        root.classList.add(mode);
        root.setAttribute('data-theme', theme);

        // Persist
        localStorage.setItem('app_theme', theme);
        localStorage.setItem('app_mode', mode);
    }, [theme, mode]);

    const toggleMode = () => {
        setMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
