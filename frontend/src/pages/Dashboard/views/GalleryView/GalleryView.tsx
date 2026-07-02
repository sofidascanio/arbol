import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { BookmarkCard } from '../../components/BookmarkCard/BookmarkCard';
import { Bookmark } from '@/types';
import { cn } from '@/utils/cn';
import { ConfirmModal } from '@/components/ui/ConfirmModal/ConfirmModal';
import { SortState } from '@/types/sort';
import styles from './GalleryView.module.css';

interface GalleryViewProps {
    searchQuery: string;
    activeFolderId?: string;
    activeTagName?: string;
    onAddNew: () => void;
    favoritesOnly?: boolean; 
    onEdit?: (bookmark: Bookmark) => void;
    hideAddNew?: boolean; 
    sortState?: SortState;
}

export const GalleryView = ({
    searchQuery,
    activeFolderId,
    activeTagName,
    onAddNew,
    favoritesOnly, 
    onEdit,
    hideAddNew = false, 
    sortState
}: GalleryViewProps) => {
    const [activeTag, setActiveTag] = useState('');
    const { bookmarks, total, isLoading, fetchBookmarks, deleteBookmark, handleFavoriteToggle } = useBookmarks();

    // estado del modal de confirmacion: eliminar marcador
    const [bookmarkToDelete, setBookmarkToDelete] = useState<string | null>(null);

    // re-fetch cuando cambia carpeta, busqueda o tag del sidebar
    useEffect(() => {
        fetchBookmarks({
            search: searchQuery || undefined,
            folderId: activeFolderId,
            tag: activeTagName || undefined,
            favoritesOnly: favoritesOnly || undefined,
            sortBy: sortState?.sortBy, 
            sortDir: sortState?.sortDir, 
        });
        // limpia filtro local al cambiar contexto
        setActiveTag('');
    }, [searchQuery, activeFolderId, activeTagName, favoritesOnly, sortState]);

    // extrae etiquetas unicas de los bookmarks cargados
    const availableTags = useMemo(() => {
        const seen = new Map<string, { name: string; count: number }>();

        for (const bookmark of bookmarks) {
            for (const bt of bookmark.tags) {
                const name = bt.tag.name;
                if (seen.has(name)) {
                    seen.get(name)!.count++;
                } else {
                    seen.set(name, { name, count: 1 });
                }
            }
        }

        // ordena por cantidad de apariciones, luego alfabetico
        return [...seen.values()].sort(
            (a, b) => b.count - a.count || a.name.localeCompare(b.name)
        );
    }, [bookmarks]);

    // filtra bookmarks por etiqueta seleccionada localmente
    const filteredBookmarks = useMemo(() => {
        if (!activeTag) return bookmarks;
            return bookmarks.filter(bm =>
            bm.tags.some(bt => bt.tag.name === activeTag)
        );
    }, [bookmarks, activeTag]);

    const handleDelete = useCallback((id: string) => {
        setBookmarkToDelete(id);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!bookmarkToDelete) return;
        try {
            await deleteBookmark(bookmarkToDelete);
        } catch {
            alert('No se pudo eliminar el marcador');
        }
    }, [bookmarkToDelete, deleteBookmark]);

    const handleTagFilter = (tagName: string) => {
        // click en el tag activo lo deselecciona
        setActiveTag(prev => (prev === tagName ? '' : tagName));
    };

    return (
        <div className={styles.container}>
            {/* encabezado  */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>
                        {activeFolderId ? 'Carpeta' : 'Todos los marcadores'}
                    </h1>
                </div>
                <p className={styles.subtitle}>
                    {total} {total === 1 ? 'referencia guardada' : 'referencias guardadas'}{' '}
                    en tu archivo.
                </p>
            </div>

            {/* filtros por etiqueta  */}
            {!isLoading && availableTags.length > 0 && (
                <div className={styles.filters}>
                    <span className={styles.filterLabel}>Etiquetas:</span>

                    {/* chip "Todos" */}
                    <button
                        className={cn(
                            styles.filterChip,
                            activeTag === '' && styles.filterChipActive
                        )}
                        onClick={() => setActiveTag('')}
                    >
                        Todos
                        <span className={styles.filterChipCount}>{bookmarks.length}</span>
                    </button>

                    {/* un chip por etiqueta existente en la vista */}
                    {availableTags.map(tag => (
                        <button
                            key={tag.name}
                            className={cn(
                                styles.filterChip,
                                activeTag === tag.name && styles.filterChipActive
                            )}
                            onClick={() => handleTagFilter(tag.name)}
                        >
                            {tag.name}
                            <span className={styles.filterChipCount}>{tag.count}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* grilla  */}
            {isLoading ? (
                <div className={styles.loading}>
                    <span
                        className="material-symbols-outlined"
                        style={{ animation: 'spin 1s linear infinite', fontSize: 24 }}
                    >
                        progress_activity
                    </span>
                    Cargando...
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredBookmarks.length === 0 && (
                        <div className={styles.empty}>
                            <p className={styles.emptyTitle}>
                                {activeTag
                                ? `Sin marcadores con la etiqueta "${activeTag}"`
                                : 'Sin resultados'}
                            </p>
                            <p>
                                {activeTag
                                ? 'Proba seleccionando otra etiqueta.'
                                : 'Proba con otro filtro o agregá un nuevo marcador.'}
                            </p>
                        </div>
                    )}

                    {filteredBookmarks.map(bookmark => (
                        <BookmarkCard
                            key={bookmark.id}
                            bookmark={bookmark}
                            onDelete={handleDelete}
                            onFavoriteToggle={handleFavoriteToggle}
                            onEdit={onEdit}
                        />
                    ))}

                    {/* tarjeta para agregar nuevo */}
                    {!hideAddNew && (
                        <button className={styles.addCard} onClick={onAddNew}>
                            <div className={styles.addCardIcon}>
                                <span className="material-symbols-outlined">add_link</span>
                            </div>
                            <span className={styles.addCardLabel}>Agregar marcador</span>
                            <span className={styles.addCardSub}>
                                Pega un enlace o agregalo manualmente
                            </span>
                        </button>
                    )}
                </div>
            )}

            {/* modal eliminar marcador */}
            <ConfirmModal
                isOpen={!!bookmarkToDelete}
                onClose={() => setBookmarkToDelete(null)}
                onConfirm={confirmDelete}
                title="Eliminar marcador"
                message="¿Eliminar este marcador?"
                confirmLabel="Eliminar"
            />
        </div>
    );
};