import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';

export type ThemeId =
    | 'light'
    | 'dark'
    | 'sepia'
    | 'dark-sepia'
    | 'slate'
    | 'forest';

export interface ThemeDefinition {
    id: ThemeId;
    label: string;
    isDark: boolean;
    preview: {
        bg: string;
        surface: string;
        primary: string;
        text: string;
    };
}

export const THEMES: ThemeDefinition[] = [
    {
        id: 'light',
        label: 'Claro',
        isDark: false,
        preview: {
            bg: '#fdf8f7',
            surface: '#ffffff',
            primary: '#21201a',
            text: '#1c1b1b',
        },
    },
    {
        id: 'dark',
        label: 'Oscuro',
        isDark: true,
        preview: {
            bg: '#141313',
            surface: '#201f1f',
            primary: '#cbc6bd',
            text: '#e6e2e0',
        },
    },
    {
        id: 'sepia',
        label: 'Sepia',
        isDark: false,
        preview: {
            bg: '#f5f0e8',
            surface: '#faf6ee',
            primary: '#5c4a1e',
            text: '#2c2418',
        },
    },
    {
        id: 'dark-sepia',
        label: 'Sepia oscuro',
        isDark: true,
        preview: {
            bg: '#1a1510',
            surface: '#261f14',
            primary: '#d4b87a',
            text: '#e8dcc8',
        },
    },
    {
        id: 'slate',
        label: 'Pizarra',
        isDark: false,
        preview: {
            bg: '#f0f4f8',
            surface: '#ffffff',
            primary: '#1a3a5c',
            text: '#0f1923',
        },
    },
    {
        id: 'forest',
        label: 'Bosque',
        isDark: false,
        preview: {
            bg: '#f2f5f0',
            surface: '#ffffff',
            primary: '#1a4020',
            text: '#141f10',
        },
    },
];

interface ThemeContextType {
    theme: ThemeId;
    themeDefinition: ThemeDefinition;
    setTheme: (theme: ThemeId) => void;
    toggleDark: () => void;
    // color de acento personalizado (override a --primary)
    accentColor: string | null;
    setAccentColor: (color: string | null) => void;
    isPanelOpen: boolean;
    openPanel: () => void;
    closePanel: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY_THEME = 'bm-theme';
const STORAGE_KEY_ACCENT = 'bm-accent';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<ThemeId>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_THEME) as ThemeId | null;
        if (saved && THEMES.find(t => t.id === saved)) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    });

    const [accentColor, setAccentColorState] = useState<string | null>(() => {
        return localStorage.getItem(STORAGE_KEY_ACCENT);
    });

    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const themeDefinition = THEMES.find(t => t.id === theme) ?? THEMES[0];

    // Aplicar tema al DOM
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY_THEME, theme);
    }, [theme]);

    // Aplicar color de acento personalizado como CSS variable
    useEffect(() => {
        if (accentColor) {
        document.documentElement.style.setProperty('--primary', accentColor);
        // Generar versión clara del acento para on-primary
        document.documentElement.style.setProperty('--on-primary', '#ffffff');
        localStorage.setItem(STORAGE_KEY_ACCENT, accentColor);
        } else {
        // Remover override y dejar que el tema maneje --primary
        document.documentElement.style.removeProperty('--primary');
        document.documentElement.style.removeProperty('--on-primary');
        localStorage.removeItem(STORAGE_KEY_ACCENT);
        }
    }, [accentColor]);

    const setTheme = useCallback((newTheme: ThemeId) => {
        setThemeState(newTheme);
        // Al cambiar tema, limpiar acento custom para que tome el del tema
        setAccentColorState(null);
        document.documentElement.style.removeProperty('--primary');
        document.documentElement.style.removeProperty('--on-primary');
        localStorage.removeItem(STORAGE_KEY_ACCENT);
    }, []);

    const toggleDark = useCallback(() => {
        setTheme(themeDefinition.isDark ? 'light' : 'dark');
    }, [themeDefinition.isDark, setTheme]);

    const setAccentColor = useCallback((color: string | null) => {
        setAccentColorState(color);
    }, []);

    const openPanel = useCallback(() => setIsPanelOpen(true), []);
    const closePanel = useCallback(() => setIsPanelOpen(false), []);

    return (
        <ThemeContext.Provider
        value={{
            theme,
            themeDefinition,
            setTheme,
            toggleDark,
            accentColor,
            setAccentColor,
            isPanelOpen,
            openPanel,
            closePanel,
        }}
        >
        {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
    return ctx;
};