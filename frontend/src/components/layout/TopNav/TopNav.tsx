import { useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { ThemePanel } from '@/components/ui/ThemePanel/ThemePanel';
import { Button } from '@/components/ui/Button/Button';
import { cn } from '@/utils/cn';
import styles from './TopNav.module.css';

export type ViewMode = 'gallery' | 'list' | 'folders';

interface TopNavProps {
    viewMode: ViewMode;
    onViewChange: (view: ViewMode) => void;
    onSearch: (query: string) => void;
    searchValue: string;
    onAddNew: () => void;
    hideViewTabs?: boolean;
    hideSearch?: boolean; 
}

const VIEW_TABS: { key: ViewMode; label: string }[] = [
    { key: 'gallery', label: 'Galería' },
    { key: 'list', label: 'Lista' },
    { key: 'folders', label: 'Carpetas' },
];

export const TopNav = ({
    viewMode,
    onViewChange,
    onSearch,
    searchValue,
    onAddNew,
    hideViewTabs = false,
    hideSearch = false, 
}: TopNavProps) => {
    const { themeDefinition, openPanel } = useTheme();
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <>
        <header className={styles.topnav}>
            {/* busqueda */}
            {!hideSearch && (
                <div className={styles.searchWrapper}>
                    <span className={cn('material-symbols-outlined', styles.searchIcon)}>
                        search
                    </span>
                    <input
                        ref={searchRef}
                        className={styles.searchInput}
                        placeholder="Buscar en tu archivo..."
                        value={searchValue}
                        onChange={e => onSearch(e.target.value)}
                        type="text"
                    />
                    <span className={styles.searchKbd}>⌘K</span>
                </div>
            )}

            {/* tabs de vista  */}
            {!hideViewTabs && (
                <nav className={styles.viewTabs}>
                    {VIEW_TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={cn(
                                styles.viewTab,
                                viewMode === tab.key && styles.viewTabActive
                            )}
                            onClick={() => onViewChange(tab.key)}
                        >
                        {tab.label}
                        </button>
                    ))}
                </nav>
            )}

            {/* acciones  */}
            <div className={styles.actions}>
                <button className={styles.iconBtn} title="Filtrar">
                    <span className="material-symbols-outlined">filter_list</span>
                </button>
                <button className={styles.iconBtn} title="Ordenar">
                    <span className="material-symbols-outlined">sort</span>
                </button>

                <div className={styles.divider} />

                <button
                    className={styles.themeBtn}
                    onClick={openPanel}
                    title="Personalizar tema"
                >
                    <span className="material-symbols-outlined">
                        {themeDefinition.isDark ? 'dark_mode' : 'light_mode'}
                    </span>
                </button>

                <Button onClick={onAddNew} size="md">
                    Agregar
                </Button>
            </div>
        </header>

        {/* panel de temas, se renderiza fuera del header para el z-index */}
        <ThemePanel />
        </>
    );
};