import { useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { ThemePanel } from '@/components/ui/ThemePanel/ThemePanel';
import { Button } from '@/components/ui/Button/Button';
import { cn } from '@/utils/cn';
import { SortState } from '@/types/sort';
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
    onSortChange?: (sort: SortState) => void;
    sortState?: SortState;   
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
    onSortChange,
    sortState,
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
                {onSortChange && sortState && (
                    <>
                        {/* ordenar por nombre */}
                        <button
                            className={cn(
                                styles.iconBtn,
                                sortState.sortBy === 'title' && styles.iconBtnActive
                            )}
                            onClick={() => {
                                if (sortState.sortBy === 'title') {
                                    // toggle dirección
                                    onSortChange({
                                        sortBy: 'title',
                                        sortDir: sortState.sortDir === 'asc' ? 'desc' : 'asc',
                                    });
                                } else {
                                    onSortChange({ sortBy: 'title', sortDir: 'asc' });
                                }
                            }}
                            title={
                                sortState.sortBy === 'title'
                                ? sortState.sortDir === 'asc'
                                    ? 'Nombre: A → Z (click para invertir)'
                                    : 'Nombre: Z → A (click para invertir)'
                                : 'Ordenar por nombre'
                            }
                        >
                            <span className="material-symbols-outlined">
                                {sortState.sortBy === 'title'
                                    ? sortState.sortDir === 'asc'
                                        ? 'sort_by_alpha'
                                        : 'sort_by_alpha'
                                    : 'sort_by_alpha'}
                            </span>
                            {sortState.sortBy === 'title' && (
                                <span className={styles.sortDirIndicator}>
                                    {sortState.sortDir === 'asc' ? '' : ''}
                                </span>
                            )}
                        </button>

                        {/* ordenar por fecha */}
                        <button
                            className={cn(
                                styles.iconBtn,
                                sortState.sortBy === 'createdAt' && styles.iconBtnActive
                            )}
                            onClick={() => {
                                if (sortState.sortBy === 'createdAt') {
                                    onSortChange({
                                        sortBy: 'createdAt',
                                        sortDir: sortState.sortDir === 'desc' ? 'asc' : 'desc',
                                    });
                                } else {
                                    onSortChange({ sortBy: 'createdAt', sortDir: 'desc' });
                                }
                            }}
                            title={
                                sortState.sortBy === 'createdAt'
                                ? sortState.sortDir === 'desc'
                                    ? 'Más recientes primero (click para invertir)'
                                    : 'Más antiguos primero (click para invertir)'
                                : 'Ordenar por fecha'
                            }
                        >
                        <span className="material-symbols-outlined">
                            {sortState.sortBy === 'createdAt' && sortState.sortDir === 'asc'
                            ? 'clock_arrow_down'
                            : 'clock_arrow_up'}
                        </span>
                        {sortState.sortBy === 'createdAt' && (
                            <span className={styles.sortDirIndicator}>
                                {sortState.sortDir === 'desc' ? '' : ''}
                            </span>
                        )}
                        </button>
                    </>
                )}

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